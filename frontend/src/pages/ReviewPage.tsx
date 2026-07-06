import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '../api/api.ts';
import type { AttemptDetail } from '../types.ts';
import GameplayHudPortal from '../components/GameplayHudPortal.tsx';
import LearningDashboardLayout from '../components/LearningDashboardLayout.tsx';
import ReviewQuestionCard from '../components/quiz/ReviewQuestionCard.tsx';
import { useQuiz } from '../contexts/QuizContext.tsx';

interface ReviewArchiveHudStripProps {
  attempt: AttemptDetail;
  activeDot: number;
  onJump: (index: number) => void;
  onArchive: () => void;
}

function ReviewArchiveHudStrip({ attempt, activeDot, onJump, onArchive }: ReviewArchiveHudStripProps) {
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
  const { startQuiz } = useQuiz();

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDot, setActiveDot] = useState(0);

  const jumpTo = useCallback((i: number) => {
    setActiveDot(i);
    document.getElementById(`rvc-${i}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  const startNewRun = useCallback(async () => {
    // Navigate only on a successful start so a failed request doesn't drop the user on a
    // gate screen with the error already cleared.
    const started = await startQuiz();
    if (started) {
      navigate('/quiz');
    } else {
      setError('Could not start a new quiz. Please try again.');
    }
  }, [navigate, startQuiz]);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const data = await api.get<AttemptDetail>(`/quiz/history/${attemptId}`);
        setAttempt(data);
      } catch (err) {
        setError((err instanceof Error && err.message) || 'Failed to load review.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId]);

  if (loading) {
    return (
      <LearningDashboardLayout>
        <p className="loading-state ld-page-lead">Opening your debrief…</p>
      </LearningDashboardLayout>
    );
  }

  if (error) {
    return (
      <LearningDashboardLayout>
        <p className="error-message">{error}</p>
      </LearningDashboardLayout>
    );
  }

  if (!attempt) {
    return (
      <LearningDashboardLayout>
        <p className="empty-state">No attempt found.</p>
      </LearningDashboardLayout>
    );
  }

  return (
    <LearningDashboardLayout
      headerExtras={(
        <GameplayHudPortal mode="review">
          <ReviewArchiveHudStrip
            attempt={attempt}
            activeDot={activeDot}
            onJump={jumpTo}
            onArchive={() => navigate('/history')}
          />
        </GameplayHudPortal>
      )}
    >
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

      <section className="hist-attempts review-cards" aria-label="Question debrief">
        {attempt.review.map((item, index) => (
          <ReviewQuestionCard key={item.questionId || index} item={item} index={index} />
        ))}
      </section>

      <div className="review-footer-actions">
        <button type="button" className="btn-debrief ld-footer-btn ld-footer-btn--primary" onClick={startNewRun}>
          New run
        </button>
        <button
          type="button"
          className="btn-rv-again ld-footer-btn ld-footer-btn--ghost"
          onClick={() => navigate('/history')}
        >
          ← Archive
        </button>
      </div>
    </LearningDashboardLayout>
  );
}

export default ReviewPage;
