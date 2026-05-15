import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '../api/api.js';
import GameplayHudPortal from '../components/GameplayHudPortal.jsx';
import ReviewQuestionCard from '../components/quiz/ReviewQuestionCard.jsx';
import QuizWorldBackground from '../components/quiz/QuizWorldBackground.jsx';

function ReviewArchiveHudStrip({ attempt, activeDot, onJump, onArchive }) {
  const correctCount = attempt.review.filter((r) => r.isCorrect).length;
  const total = attempt.total || attempt.review.length;
  return (
    <div className="review-progress-strip review-progress-strip--archive-route">
      <span className="qdb-score" title="+1 point per correct answer">
        Outcome:
        {' '}
        {attempt.score}
        /
        {total}
        <span className="qdb-score-sub">
          {' '}
          (
          {correctCount}
          /
          {total}
          {' '}
          correct)
        </span>
      </span>
      <div className="qdb-dots" role="tablist" aria-label="Jump to question">
        {attempt.review.map((row, i) => (
          <button
            key={row.questionId || i}
            type="button"
            className={`q-dot ${row.isCorrect ? 'cor' : 'wrg'}${activeDot === i ? ' active-dot' : ''}`}
            onClick={() => onJump(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button type="button" className="qdb-back" onClick={onArchive}>
        ← Archive
      </button>
    </div>
  );
}

function ReviewPage() {
  const navigate = useNavigate();
  const { attemptId } = useParams();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDot, setActiveDot] = useState(0);

  const jumpTo = useCallback((i) => {
    setActiveDot(i);
    document.getElementById(`rvc-${i}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

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
        <QuizWorldBackground usePhotoBackdrop />
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
        <QuizWorldBackground usePhotoBackdrop />
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
        <QuizWorldBackground usePhotoBackdrop />
        <main className="review-page quiz-review-page">
          <div className="rv-center">
            <p className="empty-state">No attempt found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="quiz-flow-scope quiz-review-shell review-learning-page">
      <GameplayHudPortal mode="review">
        <ReviewArchiveHudStrip
          attempt={attempt}
          activeDot={activeDot}
          onJump={jumpTo}
          onArchive={() => navigate('/history')}
        />
      </GameplayHudPortal>

      <QuizWorldBackground usePhotoBackdrop />

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
            <p className="ld-meta-line">
              <strong>Completed</strong>
              {' '}
              {new Date(attempt.createdAt).toLocaleString()}
            </p>
          </header>

          <div className="review-cards">
            {attempt.review.map((item, index) => (
              <ReviewQuestionCard key={item.questionId || index} item={item} index={index} />
            ))}
          </div>

          <div className="review-footer-actions">
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
