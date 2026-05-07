import { useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import api from '../api/api';

function AttemptReview() {
  const navigate = useNavigate();

  const { id } = useParams();

  const [attempt, setAttempt] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  // =========================
  // Fetch attempt detail
  // =========================
  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const response = await api.get(
          `/quiz/history/${id}`
        );

        setAttempt(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            'Failed to load review'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [id]);

  // =========================
  // Loading / Error
  // =========================
  if (loading) {
    return <p>Loading review...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!attempt) {
    return <p>No attempt found.</p>;
  }

  return (
    <div>
      {/* =========================
          Header
      ========================= */}
      <h1>Attempt Review</h1>

      <h2>
        Score: {attempt.score} / {attempt.total}
      </h2>

      <p>
        Completed:{' '}
        {new Date(
          attempt.createdAt
        ).toLocaleString()}
      </p>

      {/* =========================
          Review questions
      ========================= */}
      {attempt.review.map((item, index) => (
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
      <button onClick={() => navigate('/history')}>
        Back to History
      </button>

      <button
        onClick={() => navigate('/quiz')}
        style={{ marginLeft: '10px' }}
      >
        Play Again
      </button>
    </div>
  );
}

export default AttemptReview;