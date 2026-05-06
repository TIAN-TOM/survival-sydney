import { createContext, useContext, useReducer } from 'react';

const QuizContext = createContext();

const initialState = {
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  score: null,
  review: [],
  loading: false,
  error: null,
};

function quizReducer(state, action) {
  switch (action.type) {
    case 'START_QUIZ':
      return {
        ...state,
        questions: action.payload.questions,
        currentQuestionIndex: 0,
        answers: [],
        score: null,
        review: [],
        error: null,
      };

    case 'ANSWER_QUESTION':
      return {
        ...state,
        answers: [...state.answers, action.payload],
      };

    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      };

    case 'SUBMIT_QUIZ':
      return {
        ...state,
        score: action.payload.score,
        review: action.payload.review,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'RESET_QUIZ':
      return initialState;

    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);

  if (!context) {
    throw new Error('useQuiz must be used within QuizProvider');
  }

  return context;
}