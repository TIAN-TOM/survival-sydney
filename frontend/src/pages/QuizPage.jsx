import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/api.js';
import { useQuiz } from '../contexts/QuizContext.jsx';

function QuizPage() {
  const navigate = useNavigate();

  const { state, dispatch } = useQuiz();

  const {
    questions,
    currentQuestionIndex,
    answers,
    loading,
    error,
  } = state;

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        dispatch({
          type: 'SET_LOADING',
          payload: true,
        });

        const data = await api.get('/quiz/start');

        dispatch({
          type: 'START_QUIZ',
          payload: {
            questions: data,
          },
        });
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err.message || 'Failed to start quiz',
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

  if (loading) {
    return <p>Loading quiz...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!questions.length) {
    return <p>No questions available.</p>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = async selectedAnswer => {
    const answerData = {
      questionId: currentQuestion._id,
      selectedAnswer,
    };

    const updatedAnswers = [...answers, answerData];

    dispatch({
      type: 'ANSWER_QUESTION',
      payload: answerData,
    });

    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    if (isLastQuestion) {
      try {
        dispatch({
          type: 'SET_LOADING',
          payload: true,
        });

        const data = await api.post('/quiz/submit', {
          answers: updatedAnswers,
        });

        dispatch({
          type: 'SUBMIT_QUIZ',
          payload: data,
        });

        navigate(`/review/${data.scoreId}`);
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err.message || 'Failed to submit quiz',
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
    <main>
      <section className="admin-section">
        <h2>
          Question {currentQuestionIndex + 1} / {questions.length}
        </h2>

        <h3>{currentQuestion.questionText}</h3>

        <div>
          {currentQuestion.options.map((option, index) => (
            <button
              key={`${currentQuestion._id}-${index}`}
              type="button"
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
      </section>
    </main>
  );
}

export default QuizPage;