import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';

import api from '../api/api.js';
import { useAuth } from './AuthContext.jsx';

const QuizContext = createContext(null);
const ACTIVE_QUIZ_LEAVE_MESSAGE = 'You have an active quiz. Leave this page and lose current progress?';
// Minimum time the "calculating" screen stays up AFTER the score is already saved server-side,
// purely so the reveal feels smooth. Persistence no longer waits on this timer.
const MIN_CALCULATING_MS = 1400;

const initialState = {
  phase: 'gate',
  attemptToken: null,
  questions: [],
  currentQ: 0,
  answers: [],
  answered: false,
  starting: false,
  error: null,
  attemptScore: null,
  attemptTotal: null,
  scoreId: null,
  review: null,
};

function quizReducer(state, action) {
  switch (action.type) {
    case 'START_PENDING':
      return { ...state, starting: true, error: null };

    case 'START_QUIZ':
      return {
        ...initialState,
        phase: 'quiz',
        attemptToken: action.payload.attemptToken,
        questions: action.payload.questions,
      };

    case 'LOCK_ANSWER':
      return { ...state, answered: true };

    case 'SUBMIT_ANSWER': {
      const newAnswers = [...state.answers, action.payload];
      const nextQ = state.currentQ + 1;
      const isDone = nextQ >= state.questions.length;
      return {
        ...state,
        answers: newAnswers,
        currentQ: nextQ,
        answered: false,
        error: null,
        phase: isDone ? 'calculating' : 'quiz',
      };
    }

    // The per-question save failed: unlock the question so the player can pick again.
    case 'ANSWER_FAILED':
      return { ...state, answered: false, error: action.payload };

    case 'SUBMIT_COMPLETE':
      return {
        ...state,
        phase: 'result',
        attemptScore: action.payload.score,
        attemptTotal: action.payload.total,
        scoreId: action.payload.scoreId,
        review: action.payload.review,
      };

    case 'SET_PHASE':
      return { ...state, phase: action.payload, error: null };

    case 'RESET_GATE':
      return {
        ...initialState,
        phase: 'gate',
      };

    case 'AUTH_REQUIRED':
      return {
        ...initialState,
        phase: 'gate',
        error: action.payload,
      };

    case 'RESTART':
      return {
        ...initialState,
        phase: 'start',
      };

    case 'QUIZ_ERROR_RESET':
      return {
        ...initialState,
        phase: 'start',
        error: action.payload,
      };

    case 'SET_ERROR':
      return { ...state, starting: false, error: action.payload };

    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  // Prevents accidental double-submit while the result screen is calculating.
  const submitOnceRef = useRef(false);
  // Prevents a second /quiz/start from racing/resetting an in-flight start.
  const startingRef = useRef(false);
  const { logout } = useAuth();
  // Only in-progress attempts need navigation protection; completed or gated screens can be left freely.
  const hasActiveQuiz = state.questions.length > 0 && ['quiz', 'calculating'].includes(state.phase);

  const setPhase = useCallback((phase) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  }, []);

  const resetToGate = useCallback(() => {
    dispatch({ type: 'RESET_GATE' });
  }, []);

  // Returns true only if a quiz actually started, so callers can avoid navigating on failure.
  const startQuiz = useCallback(async () => {
    // Ignore repeat clicks while a start request is already in flight, so a double-click
    // cannot discard a freshly started quiz and replace it with a new question set.
    if (startingRef.current) return false;
    startingRef.current = true;
    submitOnceRef.current = false;
    dispatch({ type: 'START_PENDING' });
    try {
      const data = await api.get('/quiz/start');
      dispatch({ type: 'START_QUIZ', payload: data });
      return true;
    } catch (err) {
      // A 401 here usually means the login JWT expired before the player started.
      if (err.status === 401) {
        logout();
        dispatch({
          type: 'AUTH_REQUIRED',
          payload: 'Please sign in again to start a quiz.',
        });
        return false;
      }

      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load questions' });
      return false;
    } finally {
      startingRef.current = false;
    }
  }, [logout]);

  const lockAnswer = useCallback(() => {
    dispatch({ type: 'LOCK_ANSWER' });
  }, []);

  const submitAnswer = useCallback(
    async (selectedIndex) => {
      const { questions, currentQ, attemptToken } = state;
      const q = questions[currentQ];
      if (!q) return;

      const advance = () =>
        dispatch({
          type: 'SUBMIT_ANSWER',
          payload: {
            questionId: q._id,
            sel: selectedIndex,
          },
        });

      try {
        // Lock this answer server-side before advancing; once locked it cannot change.
        await api.post('/quiz/answer', {
          attemptToken,
          questionId: q._id,
          selectedAnswer: selectedIndex,
        });
        advance();
      } catch (err) {
        if (err.status === 401) {
          logout();
          dispatch({
            type: 'AUTH_REQUIRED',
            payload: 'Please sign in again to continue your quiz.',
          });
          return;
        }

        // A retried request may find the answer already locked — that still counts as saved.
        if (err.status === 409 && /already answered/i.test(err.message || '')) {
          advance();
          return;
        }

        dispatch({
          type: 'ANSWER_FAILED',
          payload: 'Could not save your answer. Please select again.',
        });
      }
    },
    [logout, state],
  );

  const finishQuiz = useCallback(async () => {
    if (submitOnceRef.current) return;
    submitOnceRef.current = true;

    const startedAt = Date.now();
    try {
      // Answers were already locked server-side one at a time; submit only finalises.
      const data = await api.post('/quiz/submit', {
        attemptToken: state.attemptToken,
      });

      // The attempt is now persisted server-side. Hold the calculating animation for a
      // minimum beat purely for polish — leaving during this hold no longer loses the score.
      const remaining = MIN_CALCULATING_MS - (Date.now() - startedAt);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      dispatch({ type: 'SUBMIT_COMPLETE', payload: data });
    } catch (err) {
      submitOnceRef.current = false;
      // Covers both expired login JWT and expired/invalid attemptToken returned as 401 by the backend.
      if (err.status === 401) {
        logout();
        dispatch({
          type: 'AUTH_REQUIRED',
          payload: 'Please sign in again to submit your quiz.',
        });
        return;
      }

      dispatch({
        type: 'QUIZ_ERROR_RESET',
        payload: err.message || 'Failed to submit quiz',
      });
    }
  }, [logout, state]);

  const restart = useCallback(() => {
    submitOnceRef.current = false;
    dispatch({ type: 'RESTART' });
  }, []);

  const confirmActiveQuizExit = useCallback(() => {
    if (!hasActiveQuiz) return true;
    return window.confirm(ACTIVE_QUIZ_LEAVE_MESSAGE);
  }, [hasActiveQuiz]);

  // Memoise so re-renders driven by the parent Auth/Theme providers don't hand every quiz
  // consumer a brand-new value object and force needless re-renders.
  const value = useMemo(
    () => ({
      state,
      hasActiveQuiz,
      activeQuizLeaveMessage: ACTIVE_QUIZ_LEAVE_MESSAGE,
      confirmActiveQuizExit,
      setPhase,
      resetToGate,
      startQuiz,
      lockAnswer,
      submitAnswer,
      finishQuiz,
      restart,
    }),
    [
      state,
      hasActiveQuiz,
      confirmActiveQuizExit,
      setPhase,
      resetToGate,
      startQuiz,
      lockAnswer,
      submitAnswer,
      finishQuiz,
      restart,
    ],
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within QuizProvider');
  return ctx;
}

export { quizReducer, initialState };
