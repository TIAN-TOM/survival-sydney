import { useNavigate } from 'react-router-dom';

import { useQuiz } from '../contexts/QuizContext';

function Review() {
  const navigate = useNavigate();

  const { state, dispatch } = useQuiz();

  const { score, review } = state;

  // =========================
  // No review data
  // =========================
  if (!review || review.length === 0) {
    return (
      <div>
        <h2>No review data available.</h2>

        <button onClick={() => navigate('/')}>
          Back Home
        </button>
      </div>
    );
  }

  // =========================
  // Restart quiz
  // =========================
  const handleRestart = () => {
    dispatch({
      type: 'RESET_QUIZ',
    });

    navigate('/quiz');
  };

  return (
    <div>
      {/* =========================
          Final score
      ========================= */}
      <h1>Quiz Complete</h1>

      <h2>
        Your Score: {score} / {review.length}
      </h2>

      {/* =========================
          Review questions
      ========================= */}
      {review.map((item, index) => (
        <div
          key={item.questionId}
          style={{
            border: '1px solid #ccc',
            padding: '20px',
            marginBottom: '20px',
            borderRadius: '8px',
          }}
        >
          <h3>
            Question {index + 1}
          </h3>

          <p>{item.questionText}</p>

          {/* =========================
              Options
          ========================= */}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {item.options.map((option, i) => {
              const isSelected =
                i === item.selectedAnswer;

              const isCorrect =
                i === item.correctAnswer;

              return (
                <li
                  key={i}
                  style={{
                    marginBottom: '10px',
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: isCorrect
                      ? '#d4edda'
                      : isSelected
                      ? '#f8d7da'
                      : '#f1f1f1',
                  }}
                >
                  {option}

                  {isCorrect && ' ✅ Correct'}

                  {!isCorrect &&
                    isSelected &&
                    ' ❌ Your Answer'}
                </li>
              );
            })}
          </ul>

          {/* =========================
              Result
          ========================= */}
          <p>
            {item.isCorrect
              ? '✅ Correct'
              : '❌ Incorrect'}
          </p>

          {/* =========================
              Explanation
          ========================= */}
          {item.explanation && (
            <div>
              <strong>Explanation:</strong>

              <p>{item.explanation}</p>
            </div>
          )}
        </div>
      ))}

      {/* =========================
          Actions
      ========================= */}
      <button onClick={handleRestart}>
        Play Again
      </button>

      <button
        onClick={() => navigate('/history')}
        style={{ marginLeft: '10px' }}
      >
        View History
      </button>
    </div>
  );
}

export default Review;