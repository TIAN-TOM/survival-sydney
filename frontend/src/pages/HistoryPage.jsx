import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/api.js';
import QuizWorldBackground from '../components/quiz/QuizWorldBackground.jsx';
import { formatReviewCategory } from '../components/quiz/reviewFormatUtils.js';

const CHIP_ORDER = ['renting', 'transport', 'safety', 'scam', 'food', 'general'];

function chipToneClass(topic) {
  const s = String(topic).toLowerCase().replace(/\s+/g, '_');
  const idx = CHIP_ORDER.indexOf(s);
  const tone = idx >= 0 ? idx : [...s].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 6;
  return `hist-chip hist-chip--t${tone % 6}`;
}

function pickBestAttempt(rows) {
  if (!rows.length) return null;
  return rows.reduce((best, row) => {
    const tb = row.totalQuestions > 0 ? row.totalQuestions : 1;
    const ta = best.totalQuestions > 0 ? best.totalQuestions : 1;
    const rb = row.score / tb;
    const ra = best.score / ta;
    if (rb > ra) return row;
    if (rb < ra) return best;
    return row.score > best.score ? row : best;
  });
}

function HistoryAttemptCard({ attempt, attemptNo, navigate, staggerIndex = 0 }) {
  const dt = new Date(attempt.createdAt).toLocaleString();
  const dateShort = new Date(attempt.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const total = attempt.totalQuestions > 0 ? attempt.totalQuestions : 10;
  const pct = Math.round((attempt.score / total) * 100);
  const rawTopics = Array.isArray(attempt.topics) && attempt.topics.length ? attempt.topics : ['general'];
  const chips = rawTopics.map((t) => formatReviewCategory(t)).filter(Boolean);

  return (
    <article className="hist-attempt-card" style={{ '--motion-stagger-index': staggerIndex }}>
      <header className="hist-attempt-head">
        <span className="hist-attempt-no" aria-hidden="true">
          {attemptNo}
        </span>
        <h2 className="hist-attempt-title">Attempt #{attemptNo}</h2>
        <div className="hist-attempt-badges">
          <span className="hist-badge hist-badge--pts">
            {attempt.score}
            {' '}
            pts
          </span>
          <span className="hist-badge">{pct}%</span>
        </div>
      </header>
      <div className="hist-attempt-body">
        <p className="hist-date">
          <strong>Completed</strong>
          {' '}
          {dateShort}
          <span className="hist-date-full">{dt}</span>
        </p>
        <div className="hist-chip-row" aria-label="Topics in this attempt">
          {chips.map((label, i) => (
            <span key={`${label}-${i}`} className={chipToneClass(rawTopics[i] || label)}>
              {label}
            </span>
          ))}
        </div>
      </div>
      <footer className="hist-attempt-foot">
        <div className="hist-progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} role="progressbar" aria-label="Score as percent of attempt">
          <span style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <button type="button" className="hist-cta" onClick={() => navigate(`/history/${attempt._id}`)}>
          View review
          <span aria-hidden="true"> →</span>
        </button>
      </footer>
    </article>
  );
}

function HistoryPage() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.get('/quiz/history');
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const stats = useMemo(() => {
    if (!history.length) return null;
    const best = pickBestAttempt(history);
    const latest = history[0];
    const bestTotal = best?.totalQuestions > 0 ? best.totalQuestions : 10;
    const bestPct = Math.round(((best?.score ?? 0) / bestTotal) * 100);
    return {
      total: history.length,
      bestScore: best?.score ?? 0,
      bestTotal,
      bestPct,
      latestLabel: latest ? new Date(latest.createdAt).toLocaleString() : '—',
    };
  }, [history]);

  if (loading) {
    return (
      <div className="quiz-flow-scope quiz-review-shell hist-learning-page">
        <QuizWorldBackground usePhotoBackdrop />
        <main className="review-page quiz-review-page">
          <div className="rv-center">
            <p className="loading-state ld-page-lead">Loading your archive…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-flow-scope quiz-review-shell hist-learning-page">
        <QuizWorldBackground usePhotoBackdrop />
        <main className="review-page quiz-review-page">
          <div className="rv-center">
            <p className="error-message">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="quiz-flow-scope quiz-review-shell hist-learning-page">
      <QuizWorldBackground usePhotoBackdrop />

      <main className="review-page quiz-review-page">
        <div className="rv-center">
          <header>
            <h1 className="ld-page-title">
              Survival
              {' '}
              <em>Archive</em>
            </h1>
            <p className="ld-page-lead">
              A parchment record of every run through Sydney — scores, topics, and deep review when you are ready to
              learn from each attempt.
            </p>
          </header>

          {history.length > 0 && stats ? (
            <section className="hist-stats-row" aria-label="Progress summary">
              <article className="hist-stat-card hist-stat-card--total" style={{ '--motion-stagger-index': 0 }}>
                <span className="hist-stat-k">Total attempts</span>
                <span className="hist-stat-v">{stats.total}</span>
                <span className="hist-stat-sub">Runs saved to your archive</span>
              </article>
              <article className="hist-stat-card hist-stat-card--best" style={{ '--motion-stagger-index': 1 }}>
                <span className="hist-stat-k">Best performance</span>
                <span className="hist-stat-v">
                  {stats.bestScore}/{stats.bestTotal}
                </span>
                <span className="hist-stat-sub">
                  Highest accuracy:
                  {' '}
                  {stats.bestPct}
                  %
                </span>
              </article>
              <article className="hist-stat-card hist-stat-card--latest" style={{ '--motion-stagger-index': 2 }}>
                <span className="hist-stat-k">Latest run</span>
                <span className="hist-stat-v" style={{ fontSize: '1.05rem' }}>
                  {new Date(history[0].createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="hist-stat-sub">{stats.latestLabel}</span>
              </article>
            </section>
          ) : null}

          {history.length === 0 ? (
            <>
              <div className="hist-empty" role="status">
                <div className="hist-empty-illu" aria-hidden="true" />
                <h2>No survival records yet</h2>
                <p>Your first journey through the quiz will appear here as a scored parchment — ready for review whenever you return.</p>
                <button type="button" className="hist-empty-cta" onClick={() => navigate('/quiz')}>
                  Begin first quiz
                </button>
              </div>
              <div className="review-footer-actions">
                <button type="button" className="btn-rv-again ld-footer-btn ld-footer-btn--ghost" onClick={() => navigate('/quiz')}>
                  ← Home
                </button>
              </div>
            </>
          ) : (
            <>
              <section className="hist-attempts" aria-label="Past attempts">
                {history.map((attempt, index) => {
                  const attemptNo = history.length - index;
                  return (
                    <HistoryAttemptCard
                      key={attempt._id}
                      attempt={attempt}
                      attemptNo={attemptNo}
                      navigate={navigate}
                      staggerIndex={index}
                    />
                  );
                })}
              </section>
              <p className="ld-meta-line">
                <strong>Tip:</strong>
                {' '}
                open any attempt for the same structured debrief as Trial Debrief — your pick, the keyed answer, and
                scholar notes.
              </p>
              <div className="review-footer-actions">
                <button type="button" className="btn-rv-again ld-footer-btn ld-footer-btn--primary" onClick={() => navigate('/quiz')}>
                  New run
                </button>
                <button type="button" className="btn-debrief ld-footer-btn ld-footer-btn--ghost" onClick={() => navigate('/quiz')}>
                  Home
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default HistoryPage;
