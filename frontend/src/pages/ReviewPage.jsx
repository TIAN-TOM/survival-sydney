import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '../api/api.js';
import GlobalHeader from '../components/GlobalHeader.jsx';
import ReviewV7Card from '../components/quiz/ReviewV7Card.jsx';

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
    return (
      <div className="quiz-flow-scope quiz-review-shell review-learning-page">
        <GlobalHeader />
        <main className="review-page quiz-review-page">
          <div className="rv-center">
            <p className="loading-state ld-page-lead">Opening your debrief…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-flow-scope quiz-review-shell review-learning-page">
        <GlobalHeader />
        <main className="review-page quiz-review-page">
          <div className="rv-center">
            <p className="error-message">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="quiz-flow-scope quiz-review-shell review-learning-page">
        <GlobalHeader />
        <main className="review-page quiz-review-page">
          <div className="rv-center">
            <p className="empty-state">No attempt found.</p>
          </div>
        </main>
      </div>
    );
  }

  const correctCount = attempt.review.filter((r) => r.isCorrect).length;
  const total = attempt.total || attempt.review.length;
  const pct = total ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="quiz-flow-scope quiz-review-shell review-learning-page">
      <div className="sq-world-bg sq-world-bg--photo" aria-hidden="true" />

      <GlobalHeader />

      <main className="review-page quiz-review-page">
        <div className="rv-center">
          <header>
            <h1 className="ld-page-title">
              Learning
              {' '}
              <em>Debrief</em>
            </h1>
            <p className="ld-page-lead">
              Each card walks the scenario, your choice, the keyed response, and a scholar note. Wrong items open the
              note automatically so you can repair understanding first.
            </p>
            <div className="rv-final-score" role="status">
              <span className="rv-fs-label">Outcome</span>
              <span className="rv-fs-value">
                {attempt.score}
                <span className="rv-fs-slash">/</span>
                {total}
              </span>
              <span className="rv-fs-hint">
                {correctCount}
                /
                {total}
                {' '}
                correct ·
                {' '}
                {pct}
                %
              </span>
            </div>
            <p className="ld-meta-line">
              <strong>Completed</strong>
              {' '}
              {new Date(attempt.createdAt).toLocaleString()}
            </p>
          </header>

          <div className="rv-cards-v7">
            {attempt.review.map((item, index) => (
              <ReviewV7Card key={item.questionId || index} item={item} index={index} />
            ))}
          </div>

          <div className="rv-v7-footer-actions">
            <button
              type="button"
              className="btn-rv-again ld-footer-btn ld-footer-btn--ghost"
              onClick={() => navigate('/history')}
            >
              ← Archive
            </button>
            <button type="button" className="btn-debrief ld-footer-btn ld-footer-btn--primary" onClick={() => navigate('/quiz')}>
              New run
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReviewPage;
