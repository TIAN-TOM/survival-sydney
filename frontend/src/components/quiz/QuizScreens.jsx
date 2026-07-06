import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext.jsx';
import { useQuiz } from '../../contexts/QuizContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { BRAND, resultRankBand } from '../../config/brand.js';
import ThemeFloatingToggle from '../ThemeFloatingToggle.jsx';
import { quizStartHeroImageSrc } from '../../quizBrandAssets.js';
import QuizFramedPanel from './QuizFramedPanel.jsx';
import { formatReviewCategory } from './reviewFormatUtils.js';
import GameplayHudPortal from '../GameplayHudPortal.jsx';

const QUIZ_ADVANCE_DELAY_MS = 860;

const LETTERS = ['A', 'B', 'C', 'D'];

const QUIZ_HINT_PHRASES = BRAND.hintPhrases;

const TOPIC_MAP = {
  Geography: { cls: 'tp-geo', label: 'Geography' },
  Technology: { cls: 'tp-tech', label: 'Technology' },
  Science: { cls: 'tp-sci', label: 'Science' },
  Knowledge: { cls: 'tp-know', label: 'Knowledge' },
  Logic: { cls: 'tp-log', label: 'Logic' },
  Riddle: { cls: 'tp-rid', label: 'Riddle 🧩' },
};

const JOURNEY_STOP_POOL = ['🚉', '🏠', '🏥', '📋', '💼', '🔍', '⏰', '⚠️', '🏖️', '💊'];

function stopsForCount(n) {
  const total = Math.max(0, n);
  return Array.from({ length: total }, (_, i) => ({
    icon: JOURNEY_STOP_POOL[i] || '📍',
    label: `Q${i + 1}`,
  }));
}

function TopicPill({ topic, style }) {
  const meta = TOPIC_MAP[topic] || { cls: '', label: topic };
  return (
    <span className={`q-cat topic-pill ${meta.cls}`} style={style}>
      {meta.label}
    </span>
  );
}

function JourneyStrip({ total, current }) {
  const trackRef = useRef(null);
  const fillRef = useRef(null);
  const markerRef = useRef(null);
  const stops = useMemo(() => stopsForCount(total), [total]);

  const updateLayout = useCallback(() => {
    const track = trackRef.current;
    if (!track || total < 1) return;
    const w = track.offsetWidth;
    const seg = w / total;
    const cx = seg * current + seg / 2;
    if (markerRef.current) markerRef.current.style.left = `${cx}px`;
    const denom = Math.max(total - 1, 1);
    const pct = (current / denom) * 100;
    if (fillRef.current) fillRef.current.style.width = `${pct}%`;
  }, [total, current]);

  useLayoutEffect(() => {
    updateLayout();
  }, [updateLayout]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => updateLayout());
    ro.observe(track);
    return () => ro.disconnect();
  }, [updateLayout]);

  return (
    <div className="journey-strip">
      <div className="journey-track" ref={trackRef}>
        <div className="journey-line" />
        <div className="journey-line-fill" ref={fillRef} />
        <span className="path-marker" ref={markerRef} aria-hidden="true">
          ⛵
        </span>
        {stops.map((stop, i) => (
          <div
            key={`${stop.label}-${i}`}
            className={`journey-stop${i < current ? ' done' : ''}${i === current ? ' current' : ''}`}
          >
            <div className="stop-icon">{stop.icon}</div>
            <div className="stop-label">{stop.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CandleIcon({ state }) {
  return (
    <svg className="c-svg" viewBox="0 0 28 64" width="28" height="64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="48" width="16" height="11" rx="3" fill="#B09050" />
      <rect x="4" y="55" width="20" height="6" rx="2" fill="#C4A868" />
      <rect x="8" y="18" width="12" height="32" rx="3" fill="#201838" />
      <path d="M8 28 Q6 34 7 40" stroke="#2A2048" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M20 24 Q22 30 21 36" stroke="#2A2048" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="14" y1="18" x2="14" y2="13" stroke="#5A3A18" strokeWidth="1.5" strokeLinecap="round" />
      <path className="c-fl" d="M14 13 Q17 7.5 14 2 Q11 7.5 14 13Z" fill="#F8A820" />
      <path className="c-fi" d="M14 12 Q16 8.5 14 5 Q12 8.5 14 12Z" fill="#F8E060" />
      <circle className="c-gl" cx="14" cy="7" r="7" fill="rgba(248,168,32,.2)" />
    </svg>
  );
}

function QuizProgressStrip({ total, current }) {
  const stops = useMemo(() => stopsForCount(total), [total]);
  const denom = Math.max(total - 1, 1);
  const fillPct = (current / denom) * 100;

  return (
    <div className="quiz-progress-strip">
      <div className="quiz-progress-wrap">
        <div className="progress-seals" aria-hidden="true">
          <div className="seal-track">
            <div className="seal-floor">
              <div className="seal-floor-fill" style={{ width: `${fillPct}%` }} />
            </div>
            {stops.map((stop, i) => {
              const state = i < current ? 'done' : i === current ? 'current' : 'locked';
              return (
                <div className={`seal-stop ${state}`} key={`seal-${stop.label}-${i}`}>
                  <div className="seal-item">
                    <span className="seal-inner">{i < current ? '✓' : i + 1}</span>
                  </div>
                  <div className="seal-num">{stop.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="progress-candles" aria-hidden="true">
          <div className="candle-track">
            <div className="candle-floor">
              <div className="candle-floor-fill" style={{ width: `${fillPct}%` }} />
            </div>
            {stops.map((stop, i) => {
              const state = i < current ? 'done' : i === current ? 'current' : 'locked';
              return (
                <div className={`candle-stop ${state}`} key={`candle-${stop.label}-${i}`}>
                  <CandleIcon state={state} />
                  <div className="c-lbl">Q{i + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildTopicMap(review, totalQuestions, correctFallback) {
  const map = {};
  if (review?.length) {
    for (const row of review) {
      const name = row.category || row.topic || 'General';
      if (!map[name]) map[name] = { t: 0, c: 0 };
      map[name].t += 1;
      if (row.isCorrect) map[name].c += 1;
    }
    return map;
  }
  return { Overall: { t: totalQuestions, c: correctFallback } };
}

/** Guest landing on /quiz — narrative gate; sign-in lives on /login. */
export function QuizGateScreen({ authChecking = false }) {
  const { isDarkMode, theme } = useTheme();
  const { state } = useQuiz();

  return (
    <div className="qf-screen start-screen">
      <div className="auth-immersive__theme" role="region" aria-label="Appearance">
        <ThemeFloatingToggle />
      </div>
      <div className="start-screen__bg-stack hero-background" aria-hidden="true">
        <div className="start-screen__bg-pane start-screen__bg-pane--night hero-background__pane" />
        <div className="start-screen__bg-pane start-screen__bg-pane--day hero-background__pane" />
        <div className="start-screen__bg-veil start-screen__bg-veil--night" />
        <div className="start-screen__bg-veil start-screen__bg-veil--day" />
        <div className="hero-overlay" aria-hidden="true" />
      </div>
      <div className="start-screen__inner hero-content">
        <div className="start-wizard quiz-gate-wizard">
          <div className="start-wizard__brand">
            <img
              key={theme}
              className="start-wizard__brand-img"
              src={quizStartHeroImageSrc(isDarkMode)}
              alt={BRAND.name}
            />
          </div>
          <h1 className="start-wizard__title start-logo">{BRAND.name}</h1>
          <p className="start-wizard__tagline">
            <span className="start-wizard__star" aria-hidden="true">
              ✦
            </span>
            <span className="start-wizard__tagline-text">
              {BRAND.gateTagline}
            </span>
            <span className="start-wizard__star" aria-hidden="true">
              ✦
            </span>
          </p>
          {state.error ? <p className="start-error start-error--wizard">{state.error}</p> : null}
          {authChecking ? (
            <p className="start-wizard__footer" role="status" aria-live="polite">
              Verifying access...
            </p>
          ) : (
            <>
              <Link className="btn-wizard-start" to="/login">
                <span className="btn-wizard-start__shine" aria-hidden="true" />
                Sign in
              </Link>
              <p className="quiz-gate-register-hint">
                <Link to="/register">{BRAND.registerHint}</Link>
              </p>
            </>
          )}
          <p className="start-wizard__footer">
            <span className="start-wizard__quill" aria-hidden="true">
              🪶
            </span>
            {BRAND.gateFooter}
          </p>
        </div>
      </div>
    </div>
  );
}

export function StartScreen() {
  const { startQuiz, state } = useQuiz();
  const { isAdmin } = useAuth();
  const { isDarkMode, theme } = useTheme();

  return (
    <div className="qf-screen start-screen">
      <div className="start-screen__bg-stack" aria-hidden="true">
        <div className="start-screen__bg-pane start-screen__bg-pane--night" />
        <div className="start-screen__bg-pane start-screen__bg-pane--day" />
        <div className="start-screen__bg-veil start-screen__bg-veil--night" />
        <div className="start-screen__bg-veil start-screen__bg-veil--day" />
      </div>
      <div className="start-screen__inner">
        <div className="start-wizard">
          <div className="start-wizard__brand">
            <img
              key={theme}
              className="start-wizard__brand-img"
              src={quizStartHeroImageSrc(isDarkMode)}
              alt={BRAND.name}
            />
          </div>
          <h1 className="start-wizard__title start-logo">{BRAND.name}</h1>
          <p className="start-wizard__tagline">
            <span className="start-wizard__star" aria-hidden="true">
              ✦
            </span>
            <span className="start-wizard__tagline-text">
              {BRAND.startTagline}
            </span>
            <span className="start-wizard__star" aria-hidden="true">
              ✦
            </span>
          </p>
          {state.error ? <p className="start-error start-error--wizard">{state.error}</p> : null}
          {isAdmin ? (
            <>
              <p className="start-wizard__tagline" style={{ marginTop: '0.5rem' }}>
                <span className="start-wizard__star" aria-hidden="true">
                  ✦
                </span>
                <span className="start-wizard__tagline-text">
                  You are signed in as an administrator. Quiz play is disabled — manage questions from the admin
                  console.
                </span>
                <span className="start-wizard__star" aria-hidden="true">
                  ✦
                </span>
              </p>
              <Link className="btn-wizard-start" to="/admin">
                <span className="btn-wizard-start__shine" aria-hidden="true" />
                Open admin console
              </Link>
            </>
          ) : (
            <button
              type="button"
              className="btn-wizard-start"
              onClick={startQuiz}
              disabled={state.starting}
            >
              <span className="btn-wizard-start__shine" aria-hidden="true" />
              {state.starting ? 'Starting…' : 'Start Quiz'}
            </button>
          )}
          <p className="start-wizard__footer">
            <span className="start-wizard__quill" aria-hidden="true">
              🪶
            </span>
            {BRAND.startFooter}
          </p>
        </div>
      </div>
    </div>
  );
}

export function QuizScreen() {
  const { state, lockAnswer, submitAnswer } = useQuiz();
  const { questions, currentQ, answers, answered } = state;
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [featherBurst, setFeatherBurst] = useState(false);
  const [hoveredOpt, setHoveredOpt] = useState(null);

  useEffect(() => {
    setPendingAnswer(null);
    setFeatherBurst(false);
    setHoveredOpt(null);
  }, [currentQ]);

  const handleSelect = useCallback(
    (cardIdx, optIdx) => {
      if (answered || cardIdx !== currentQ) return;
      setPendingAnswer(optIdx);
      setFeatherBurst(true);
      setTimeout(() => setFeatherBurst(false), 620);
      lockAnswer();
      setTimeout(() => {
        submitAnswer(optIdx);
      }, QUIZ_ADVANCE_DELAY_MS);
    },
    [answered, currentQ, lockAnswer, submitAnswer],
  );

  const n = questions.length;
  const currentQuestion = questions[currentQ];
  const currentTopic =
    formatReviewCategory(currentQuestion?.category || currentQuestion?.topic || '') || BRAND.defaultTopicLabel;
  const hintPhrase = QUIZ_HINT_PHRASES[currentQ % QUIZ_HINT_PHRASES.length];

  return (
    <div className="qf-screen quiz-screen">
      <GameplayHudPortal mode="quiz">
        <QuizProgressStrip total={n} current={currentQ} />
      </GameplayHudPortal>
      <div className="quiz-screen-shell">
        <main className="quiz-content">
          <section className="question-card">
            <div className="quiz-body">
              <div className="quiz-fade-wrap" key={currentQuestion?._id || currentQ}>
                <div className="quiz-slide">
                  <QuizFramedPanel className="active">
                    <div className={`mystic-feather-burst${featherBurst ? ' active' : ''}`} aria-hidden="true">
                      <span>🪶</span>
                      <span>✦</span>
                      <span>🪶</span>
                    </div>

                    <header className="quiz-question-header">
                      <div className="quiz-question-header__row">
                        <div className="quiz-question-header__cluster">
                          <span className="q-num">Q{currentQ + 1}</span>
                          <span className="q-trial-lbl">{BRAND.questionLabel}</span>
                        </div>
                        <TopicPill topic={currentTopic} />
                      </div>
                    </header>

                    <div className="q-text">{currentQuestion?.questionText}</div>

                    <div className="q-divider q-divider--ornate" role="presentation">
                      <span className="q-div-orn">✦</span>
                      <span className="q-div-line" aria-hidden="true" />
                      <span className="q-div-orn">✦</span>
                      <span className="q-div-line" aria-hidden="true" />
                      <span className="q-div-orn">✦</span>
                    </div>

                    <div className="opts">
                      {(currentQuestion?.options || []).map((opt, j) => {
                        const isSelected = pendingAnswer === j;
                        const isHover = !answered && hoveredOpt === j;
                        return (
                          <button
                            key={j}
                            type="button"
                            className={`opt ${isSelected ? 'selected' : ''}${isHover ? ' opt-hover' : ''}`}
                            disabled={answered}
                            onMouseEnter={() => {
                              if (!answered) setHoveredOpt(j);
                            }}
                            onMouseLeave={() => setHoveredOpt(null)}
                            onClick={() => handleSelect(currentQ, j)}
                          >
                            <span className="opt-badge">{LETTERS[j]}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {state.error ? (
                      <p className="start-error" role="alert">
                        {state.error}
                      </p>
                    ) : null}

                    <p className="q-hint q-hint--card-foot q-hint--atmosphere" role="note">
                      <span className="q-hint-feather" aria-hidden="true">
                        🪶
                      </span>
                      <span>{hintPhrase}</span>
                    </p>
                  </QuizFramedPanel>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export function CalculatingScreen() {
  return (
    <div className="qf-screen calculating-screen">
      <div className="calc-inner">
        <div className="calc-roo" aria-hidden="true">
          🕯️
        </div>
        <div className="calc-title">Tallying Results</div>
        <div className="calc-sub">Crunching your scores…</div>
        <div className="calc-dots">
          <div className="cdot" />
          <div className="cdot" />
          <div className="cdot" />
        </div>
      </div>
    </div>
  );
}

export function ResultScreen() {
  const { state, startQuiz } = useQuiz();
  const navigate = useNavigate();
  const { attemptScore, attemptTotal, review, scoreId } = state;
  const ringRef = useRef(null);

  const total = attemptTotal || review?.length || 10;
  const correct = typeof attemptScore === 'number' ? attemptScore : 0;
  const pct = Math.round((correct / total) * 100);
  const RING_R = 14;
  const CIRC = 2 * Math.PI * RING_R;

  const rankBand = useMemo(() => resultRankBand(pct), [pct]);

  useEffect(() => {
    const color = pct >= 80 ? '#6b8f7d' : pct >= 50 ? '#7d8a78' : '#b87a6a';
    const timer = setTimeout(() => {
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = `${CIRC * (1 - pct / 100)}`;
        ringRef.current.style.stroke = color;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [pct, CIRC]);

  const topicMap = buildTopicMap(review, total, correct);
  const topicEntries = useMemo(() => Object.entries(topicMap).slice(0, 6), [topicMap]);

  const messages = [
    [100, 'Flawless run', 'Every signal read true — rare air.'],
    [80, 'Outstanding', `${correct} of ${total} locked in with conviction.`],
    [60, 'Solid crossing', `${correct} correct. The archive will sharpen the rest.`],
    [40, 'Still learning the streets', `${correct} right — let the explanations anchor you.`],
    [0, 'Rough tide', 'Walk the debrief card by card before the next launch.'],
  ];
  const [, msg, sub] = messages.find(([t]) => pct >= t);

  const handlePlayAgain = useCallback(() => {
    startQuiz();
  }, [startQuiz]);

  const goToAttemptReview = useCallback(() => {
    if (!scoreId) return;
    navigate(`/history/${scoreId}`, { replace: true });
  }, [navigate, scoreId]);

  return (
    <div className="qf-screen result-screen">
      <main className="result-content">
        <div className="rv-center result-rv">
          <div className="result-inner">
            <QuizFramedPanel className="result-stack result-stack--finale result-card">
              <div className="result-hero-wrap">
                <header className="result-hero-section">
                  <p className="result-eyebrow motion-result-reveal motion-result-reveal--score">Trial complete</p>
                  <div className="result-score-hero motion-result-reveal motion-result-reveal--score">
                    <p className="result-score-line" aria-label={`Score ${correct} out of ${total}`}>
                      <span className="result-score">{correct}</span>
                      <span className="score-total">/{total}</span>
                    </p>
                  </div>
                  <div className="motion-result-reveal motion-result-reveal--title">
                    <h2 className="result-ending-title">{rankBand.title}</h2>
                    <div className="result-description">
                    <p className="result-description__lead">{msg}</p>
                    <p className="result-description__sub">{sub}</p>
                    <p className="result-description__aside">{rankBand.lines[0]}</p>
                    </div>
                  </div>
                  <div className="result-mini-stats motion-result-reveal motion-result-reveal--accuracy">
                    <div
                      className="result-accuracy-row"
                      aria-label={`${pct}% accuracy; final score; plus one point per correct answer`}
                    >
                        <div className="result-accuracy-ring" aria-hidden="true">
                          <svg width="24" height="24" viewBox="0 0 36 36">
                          <circle className="sr-track--mini" cx="18" cy="18" r={RING_R} />
                          <circle className="sr-fill--mini" ref={ringRef} cx="18" cy="18" r={RING_R} />
                        </svg>
                      </div>
                      <p className="result-accuracy-row__txt">
                        <span className="result-accuracy-row__pct">{pct}%</span>
                        <span className="result-accuracy-row__mid"> Accuracy · Final score</span>
                        <span className="result-accuracy-row__muted"> (+1 per correct)</span>
                      </p>
                    </div>
                  </div>
                </header>
              </div>

              <div className="result-topics-wrap motion-result-reveal motion-result-reveal--topics">
                <p className="result-topics-subline">
                  {BRAND.resultTopicsSubline}
                </p>
                <p className="result-topics-section-label">Topic performance</p>
                <div
                  className="topic-performance-grid"
                  role="list"
                  aria-label="Topic performance"
                >
                  {topicEntries.map(([name, { t: tgTotal, c }], topicIndex) => {
                    const frac = tgTotal ? c / tgTotal : 0;
                    const tier = frac === 1 ? 'high' : frac >= 0.5 ? 'mid' : 'low';
                    return (
                      <article
                        key={name}
                        className={`topic-performance-card topic-performance-card--tier-${tier}`}
                        role="listitem"
                        style={{ '--motion-stagger-index': topicIndex }}
                      >
                        <h4 className="topic-performance-card__title">
                          {formatReviewCategory(name) || name}
                        </h4>
                        <div className="topic-score">
                          <span className="topic-score__num">{c}</span>
                          <span className="topic-score__slash" aria-hidden="true">
                            /
                          </span>
                          <span className="topic-score__den">{tgTotal}</span>
                        </div>
                        <div className="topic-performance-track" aria-hidden="true">
                          <div className="topic-performance-fill" style={{ width: `${frac * 100}%` }} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="result-actions result-actions--finale motion-result-reveal motion-result-reveal--actions">
                <div className="result-actions__cluster">
                  <div className="result-actions__btn-row">
                    <button
                      type="button"
                      className="btn-debrief result-actions__cta-primary"
                      onClick={goToAttemptReview}
                      disabled={!scoreId}
                    >
                      Review your run
                    </button>
                    <button
                      type="button"
                      className="btn-again btn-again--outline result-actions__cta-secondary"
                      onClick={handlePlayAgain}
                      disabled={state.starting}
                    >
                      {state.starting ? 'Starting…' : 'Try again'}
                    </button>
                  </div>
                  {state.error ? (
                    <p className="start-error start-error--wizard">{state.error}</p>
                  ) : null}
                  <div className="result-actions__tertiary-row">
                    <Link className="result-actions__tertiary-link" to="/leaderboard">
                      Leaderboard →
                    </Link>
                  </div>
                </div>
              </div>
            </QuizFramedPanel>
          </div>
        </div>
      </main>
    </div>
  );
}
