import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/api.js';
import FrameCorners from '../components/FrameCorners.jsx';
import GlobalHeader from '../components/GlobalHeader.jsx';

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
      <div className="quiz-flow-scope quiz-review-shell">
        <GlobalHeader />
        <main className="review-page quiz-review-page">
          <p className="loading-state">Loading history...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-flow-scope quiz-review-shell">
        <GlobalHeader />
        <main className="review-page quiz-review-page">
          <p className="error-message">{error}</p>
        </main>
      </div>
    );
  }

  const latest = history[0];

  return (
    <div className="quiz-flow-scope quiz-review-shell">
      <div className="sq-world-bg" aria-hidden="true" />

      <GlobalHeader />

      <main className="review-page quiz-review-page">
        <section className="admin-section review-attempt-header review-attempt-panel review-attempt-panel--framed">
          <FrameCorners />
          <h1>Quiz History</h1>

          <div className="review-attempt-final" role="status">
            <div className="review-attempt-final__label">Saved attempts</div>
            <div className="review-attempt-final__value">{history.length}</div>
            <p className="review-attempt-final__hint">Newest listed first</p>
          </div>

          <p className="review-attempt-meta">
            {latest ? <>Latest: {new Date(latest.createdAt).toLocaleString()}</> : 'No activity yet.'}
          </p>

          <p className="review-attempt-hint">
            Open <strong>View review</strong> for the same debrief layout as Review Mode — questions, your answers, and
            explanations.
          </p>
        </section>

        {history.length === 0 ? (
          <section className="admin-section review-attempt-panel review-attempt-panel--framed">
            <FrameCorners />
            <p className="review-attempt-hint">
              No quiz attempts yet. Finish a quiz on the Quiz page to build your history.
            </p>
            <div className="button-row">
              <button type="button" onClick={() => navigate('/quiz')}>
                Go to quiz
              </button>
            </div>
          </section>
        ) : (
          <section className="admin-section review-attempt-list review-attempt-panel review-attempt-panel--framed">
            <FrameCorners />
            {history.map((attempt, index) => {
              const attemptNo = history.length - index;
              return (
                <article key={attempt._id} className="review-attempt-card review-attempt-card--framed">
                  <FrameCorners />
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
                  <div className="review-attempt-card__actions">
                    <div className="button-row">
                      <button type="button" onClick={() => navigate(`/review/${attempt._id}`)}>
                        View review
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {history.length > 0 && (
          <section className="admin-section review-attempt-panel review-attempt-panel--framed">
            <FrameCorners />
            <div className="button-row">
              <button type="button" onClick={() => navigate('/quiz')}>
                Play Again
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default HistoryPage;
