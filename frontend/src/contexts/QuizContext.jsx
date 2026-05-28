import { createContext, useCallback, useContext, useReducer, useRef } from 'react';

import api from '../api/api.js';
import { useAuth } from './AuthContext.jsx';

const QuizContext = createContext(null);
const ACTIVE_QUIZ_LEAVE_MESSAGE = 'You have an active quiz. Leave this page and lose current progress?';

const initialState = {
  phase: 'gate',
  attemptToken: null,
  questions: [],
  currentQ: 0,
  answers: [],
  answered: false,
  error: null,
  attemptScore: null,
  attemptTotal: null,
  scoreId: null,
  review: null,
};

function quizReducer(state, action) {
  switch (action.type) {
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
        phase: isDone ? 'calculating' : 'quiz',
      };
    }

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
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  // Prevents accidental double-submit while the result screen is calculating.
  const submitOnceRef = useRef(false);
  const { logout } = useAuth();
  // Only in-progress attempts need navigation protection; completed or gated screens can be left freely.
  const hasActiveQuiz = state.questions.length > 0 && ['quiz', 'calculating'].includes(state.phase);

  const setPhase = useCallback((phase) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  }, []);

  const resetToGate = useCallback(() => {
    dispatch({ type: 'RESET_GATE' });
  }, []);

  const startQuiz = useCallback(async () => {
    submitOnceRef.current = false;
    try {
      const data = await api.get('/quiz/start');
      dispatch({ type: 'START_QUIZ', payload: data });
    } catch (err) {
      // A 401 here usually means the login JWT expired before the player started.
      if (err.status === 401) {
        logout();
        dispatch({
          type: 'AUTH_REQUIRED',
          payload: 'Please sign in again to start a quiz.',
        });
        return;
      }

      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load questions' });
    }
  }, [logout]);

  const lockAnswer = useCallback(() => {
    dispatch({ type: 'LOCK_ANSWER' });
  }, []);

  const submitAnswer = useCallback(
    (selectedIndex) => {
      const { questions, currentQ } = state;
      const q = questions[currentQ];
      if (!q) return;

      dispatch({
        type: 'SUBMIT_ANSWER',
        payload: {
          questionId: q._id,
          sel: selectedIndex,
        },
      });
    },
    [state],
  );

  const finishQuiz = useCallback(async () => {
    if (submitOnceRef.current) return;
    submitOnceRef.current = true;

    try {
      const answersPayload = state.answers.map((a) => ({
        questionId: a.questionId,
        selectedAnswer: a.sel,
      }));

      const data = await api.post('/quiz/submit', {
        attemptToken: state.attemptToken,
        answers: answersPayload,
      });

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

  return (
    <QuizContext.Provider
      value={{
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
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within QuizProvider');
  return ctx;
}

export { quizReducer, initialState };
