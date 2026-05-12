import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/api.js';

function HistoryPage() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.get('/quiz/history');
        setHistory(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <main className="review-page history-page">
        <section className="admin-section">
          <p className="review-attempt-meta">Loading history…</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="review-page history-page">
        <section className="admin-section">
          <p className="error-message">{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="review-page history-page">
      <section className="admin-section review-attempt-header">
        <h1>Quiz History</h1>
        <p className="review-attempt-hint">
          Newest attempts first. Use <strong>View review</strong> for the same debrief layout as Review Mode — questions,
          your answers, and explanations.
        </p>
      </section>

      {history.length === 0 ? (
        <section className="admin-section">
          <p className="review-attempt-meta">
            No quiz attempts yet. Finish a quiz on the Quiz page to build your history.
          </p>
          <div className="button-row">
            <button type="button" className="button button--primary" onClick={() => navigate('/quiz')}>
              Go to quiz
            </button>
          </div>
        </section>
      ) : (
        <section className="admin-section review-attempt-list">
          {history.map((attempt, index) => {
            const attemptNo = history.length - index;
            return (
              <article key={attempt._id} className="review-attempt-card">
                <header className="review-attempt-card__head">
                  <span className="review-attempt-mark is-ok" aria-hidden="true">
                    {attemptNo}
                  </span>
                  <h2 className="review-attempt-card__title">Attempt #{attemptNo}</h2>
                  <span className="review-attempt-verdict is-ok">{attempt.score} pts</span>
                </header>
                <p className="review-attempt-meta">
                  Completed: {new Date(attempt.createdAt).toLocaleString()}
                </p>
                <div className="button-row review-attempt-card__actions">
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => navigate(`/review/${attempt._id}`)}
                  >
                    View review
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="admin-section">
        <div className="button-row">
          <button type="button" className="button button--secondary" onClick={() => navigate('/quiz')}>
            Play again
          </button>
        </div>
      </section>
    </main>
  );
}

export default HistoryPage;
