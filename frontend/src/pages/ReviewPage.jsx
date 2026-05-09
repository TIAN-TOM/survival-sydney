import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '../api/api.js';

function ReviewPage() {
  const navigate = useNavigate();
  const { attemptId } = useParams();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const data = await api.get(`/quiz/history/${attemptId}`);
        setAttempt(data);
      } catch (err) {
        setError(err.message || 'Failed to load review.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId]);

  if (loading) {
    return <p>Loading review...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!attempt) {
    return <p>No attempt found.</p>;
  }

  return (
    <main>
      <section className="admin-section">
        <h1>Attempt Review</h1>

        <h2>
          Score: {attempt.score} / {attempt.total}
        </h2>

        <p>Completed: {new Date(attempt.createdAt).toLocaleString()}</p>
      </section>

      <section className="admin-section">
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
            <h3>Question {index + 1}</h3>

            <p>{item.questionText}</p>

            <ul style={{ listStyle: 'none', padding: 0 }}>
              {item.options.map((option, optionIndex) => {
                const isSelected = optionIndex === item.selectedAnswer;
                const isCorrect = optionIndex === item.correctAnswer;

                return (
                  <li
                    key={`${item.questionId}-${optionIndex}`}
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
                    {!isCorrect && isSelected && ' ❌ Your Answer'}
                  </li>
                );
              })}
            </ul>

            <p>{item.isCorrect ? '✅ Correct' : '❌ Incorrect'}</p>

            {item.explanation && (
              <div>
                <strong>Explanation:</strong>
                <p>{item.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="admin-section">
        <div className="button-row">
          <button type="button" onClick={() => navigate('/history')}>
            Back to History
          </button>

          <button type="button" onClick={() => navigate('/quiz')}>
            Play Again
          </button>
        </div>
      </section>
    </main>
  );
}

export default ReviewPage;