import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '../api/api.js';

const LETTERS = ['A', 'B', 'C', 'D'];

function formatReviewCategory(raw) {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (!s) return '';
  return s
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Correct: explanation folded by default; incorrect: expanded, both toggleable */
function ReviewAttemptExplanation({ isCorrect, text }) {
  const trimmed = String(text ?? '').trim();
  const has = Boolean(trimmed);
  const [open, setOpen] = useState(() => !isCorrect && has);

  if (!has) {
    return (
      <div className="review-attempt-exp review-attempt-exp--empty">
        <h3 className="review-attempt-exp__lbl">Explanation</h3>
        <p className="review-attempt-exp__missing">No explanation for this question.</p>
      </div>
    );
  }

  return (
    <div className="review-attempt-exp">
      <button
        type="button"
        className={`review-attempt-exp__toggle${open ? ' is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="review-attempt-exp__arrow" aria-hidden="true">
          ▼
        </span>
        {open ? 'Hide Explanation' : 'View Explanation'}
      </button>
      <div className={`review-attempt-exp__panel${open ? ' is-open' : ''}`}>
        <h3 className="review-attempt-exp__lbl">Explanation</h3>
        <p>{trimmed}</p>
      </div>
    </div>
  );
}

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

  const correctCount = attempt.review.filter((r) => r.isCorrect).length;
  const total = attempt.total || attempt.review.length;

  return (
    <main className="review-page">
      <section className="admin-section review-attempt-header">
        <h1>Review Mode</h1>

        <div className="review-attempt-final" role="status">
          <div className="review-attempt-final__label">Final score</div>
          <div className="review-attempt-final__value">
            {attempt.score}
            <span className="review-attempt-final__slash">/</span>
            {total}
          </div>
          <p className="review-attempt-final__hint">+1 point per correct answer</p>
        </div>

        <p className="review-attempt-meta">
          Completed: {new Date(attempt.createdAt).toLocaleString()}
          {' · '}
          <span className={correctCount === total ? 'review-attempt-meta--ok' : ''}>
            {correctCount}/{total} correct
          </span>
        </p>
        <p className="review-attempt-hint">
          Correct answers keep the explanation collapsed — use View Explanation to read it. Incorrect answers show the
          explanation by default; use Hide Explanation to collapse it.
        </p>
      </section>

      <section className="admin-section review-attempt-list">
        {attempt.review.map((item, index) => {
          const opts = item.options || [];
          const sel = item.selectedAnswer;
          const cor = item.correctAnswer;
          return (
            <article key={item.questionId} className="review-attempt-card">
              <header className="review-attempt-card__head">
                <span className={`review-attempt-mark${item.isCorrect ? ' is-ok' : ' is-bad'}`}>
                  {item.isCorrect ? '✓' : '✕'}
                </span>
                <h2 className="review-attempt-card__title">Question {index + 1}</h2>
                <span className={`review-attempt-verdict${item.isCorrect ? ' is-ok' : ' is-bad'}`}>
                  {item.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </header>

              {(item.category || item.topic) && (
                <p className="review-page-topic">
                  <strong>Topic:</strong>{' '}
                  {formatReviewCategory(item.category || item.topic)}
                </p>
              )}

              <p className="review-attempt-q">{item.questionText}</p>

              <ul className="review-attempt-options">
                {opts.map((option, optionIndex) => {
                  const isSelected = optionIndex === sel;
                  const isCorrectOpt = optionIndex === cor;

                  return (
                    <li
                      key={`${item.questionId}-${optionIndex}`}
                      className={`review-attempt-opt${isCorrectOpt ? ' is-correct' : ''}${
                        isSelected && !isCorrectOpt ? ' is-wrong' : ''
                      }${isSelected && isCorrectOpt ? ' is-picked-ok' : ''}`}
                    >
                      <span className="review-attempt-opt__letter">{LETTERS[optionIndex]}</span>
                      <span className="review-attempt-opt__text">{option}</span>
                      {isCorrectOpt && <span className="review-attempt-opt__tag">Correct</span>}
                      {!isCorrectOpt && isSelected && (
                        <span className="review-attempt-opt__tag">Your answer</span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <ReviewAttemptExplanation isCorrect={item.isCorrect} text={item.explanation} />
            </article>
          );
        })}
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
