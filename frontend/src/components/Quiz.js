import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/api';
import { useQuiz } from '../contexts/QuizContext';

function Quiz() {
  const navigate = useNavigate();

  const { state, dispatch } = useQuiz();

  const {
    questions,
    currentQuestionIndex,
    answers,
    loading,
    error,
  } = state;

  // =========================
  // Fetch quiz questions
  // =========================
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        dispatch({
          type: 'SET_LOADING',
          payload: true,
        });

        const response = await api.get('/quiz/start');

        dispatch({
          type: 'START_QUIZ',
          payload: {
            questions: response.data.data,
          },
        });
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err.response?.data?.error || 'Failed to start quiz',
        });
      } finally {
        dispatch({
          type: 'SET_LOADING',
          payload: false,
        });
      }
    };

    fetchQuiz();
  }, [dispatch]);

  // =========================
  // Loading / Error
  // =========================
  if (loading) {
    return <p>Loading quiz...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!questions.length) {
    return <p>No questions available.</p>;
  }

  // =========================
  // Current question
  // =========================
  const currentQuestion = questions[currentQuestionIndex];

  // =========================
  // Handle answer selection
  // =========================
  const handleAnswer = async (selectedAnswer) => {
    const answerData = {
      questionId: currentQuestion._id,
      selectedAnswer,
    };

    dispatch({
      type: 'ANSWER_QUESTION',
      payload: answerData,
    });

    const isLastQuestion =
      currentQuestionIndex === questions.length - 1;

    // =========================
    // Submit quiz
    // =========================
    if (isLastQuestion) {
      try {
        dispatch({
          type: 'SET_LOADING',
          payload: true,
        });

        const response = await api.post('/quiz/submit', {
          answers: [...answers, answerData],
        });

        dispatch({
          type: 'SUBMIT_QUIZ',
          payload: response.data.data,
        });

        navigate('/review');
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err.response?.data?.error || 'Failed to submit quiz',
        });
      } finally {
        dispatch({
          type: 'SET_LOADING',
          payload: false,
        });
      }
    } else {
      dispatch({
        type: 'NEXT_QUESTION',
      });
    }
  };

  return (
    <div>
      <h2>
        Question {currentQuestionIndex + 1} / {questions.length}
      </h2>

      <h3>{currentQuestion.text}</h3>

      <div>
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            style={{
              display: 'block',
              margin: '10px 0',
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Quiz;