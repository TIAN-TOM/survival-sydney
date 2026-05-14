import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext.jsx';
import { useQuiz } from '../../contexts/QuizContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { quizStartHeroImageSrc } from '../../quizBrandAssets.js';
import GlobalHeader, { QuizNavLogout, QuizTopPlayer } from '../GlobalHeader.jsx';
import QuizFramedPanel from './QuizFramedPanel.jsx';
import { AuthQuizCardShell, LoginFormPanel } from '../LoginFormPanel.jsx';

const QUIZ_ADVANCE_DELAY_MS = 860;

const LETTERS = ['A', 'B', 'C', 'D'];

/** Slug or label → Title Case (e.g. `transport` → Transport, `housing_consumers` → Housing Consumers). */
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

/** First landing on /quiz — hero + Log in; login sheet slides up over dimmed hero (same screen). */
export function QuizGateScreen() {
  const { setPhase } = useQuiz();
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  /** 与 loginOpen 解耦：关闭浮层时立刻去掉压暗，不必等滑出动画结束 */
  const [heroDimmed, setHeroDimmed] = useState(false);

  useEffect(() => {
    if (!location.state?.openAuth) return;
    setLoginOpen(true);
    setHeroDimmed(true);
    const from = typeof location.state?.from === 'string' ? location.state.from : undefined;
    navigate('/quiz', { replace: true, state: from ? { from } : {} });
  }, [location.state?.openAuth, navigate]);

  useEffect(() => {
    if (!loginOpen) {
      setSheetVisible(false);
      return undefined;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, [loginOpen]);

  const closeLogin = useCallback(() => {
    setSheetVisible(false);
    setHeroDimmed(false);
    window.setTimeout(() => setLoginOpen(false), 920);
  }, []);

  useEffect(() => {
    if (!loginOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLogin();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loginOpen, closeLogin]);

  useEffect(() => {
    if (!loginOpen) return undefined;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [loginOpen]);

  const handleLoggedIn = useCallback(
    (signedInUser) => {
      if (signedInUser?.role === 'admin') {
        setPhase('start');
        closeLogin();
        return;
      }
      const from = location.state?.from;
      if (typeof from === 'string' && from.startsWith('/') && from !== '/quiz') {
        navigate(from, { replace: true });
        return;
      }
      setPhase('start');
    },
    [closeLogin, location.state?.from, navigate, setPhase],
  );

  const gateThemePortal =
    typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`quiz-flow-scope quiz-gate-theme-portal-root${heroDimmed ? ' is-login-overlay-open' : ''}`}
          >
            <div className="start-screen-top start-screen-top--gate-portal">
              <div className="mode-row">
                <span className="mode-lbl">{isDarkMode ? 'Night' : 'Day'}</span>
                <span className="mode-icon" aria-hidden="true">{isDarkMode ? '🌙' : '☀️'}</span>
                <button
                  type="button"
                  className="mode-sw"
                  onClick={toggleTheme}
                  aria-label={isDarkMode ? 'Switch to day mode' : 'Switch to night mode'}
                  aria-pressed={!isDarkMode}
                >
                  <span className="mode-kn" />
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="qf-screen start-screen">
      {gateThemePortal}
      <div className="start-screen__bg-stack" aria-hidden="true">
        <div className="start-screen__bg-pane start-screen__bg-pane--night" />
        <div className="start-screen__bg-pane start-screen__bg-pane--day" />
        <div className="start-screen__bg-veil start-screen__bg-veil--night" />
        <div className="start-screen__bg-veil start-screen__bg-veil--day" />
      </div>
      <div className="start-screen__inner">
        <div className={`quiz-gate-dimmable${heroDimmed ? ' is-dimmed' : ''}`}>
          <div className="start-wizard quiz-gate-wizard">
            <div className="start-wizard__brand">
              <img
                key={theme}
                className="start-wizard__brand-img"
                src={quizStartHeroImageSrc(isDarkMode)}
                alt="Sydney Survival Quiz"
              />
            </div>
            <h1 className="start-wizard__title start-logo">
              Sydney Survival
              <em>Survival Quiz</em>
            </h1>
            <p className="start-wizard__tagline">
              <span className="start-wizard__star" aria-hidden="true">
                ✦
              </span>
              <span className="start-wizard__tagline-text">
                Can you survive student life in magical Sydney?
              </span>
              <span className="start-wizard__star" aria-hidden="true">
                ✦
              </span>
            </p>
            <button
              type="button"
              className="btn-wizard-start"
              onClick={() => {
                setLoginOpen(true);
                setHeroDimmed(true);
              }}
            >
              <span className="btn-wizard-start__shine" aria-hidden="true" />
              Log in
            </button>
            <p className="quiz-gate-register-hint">
              <Link to="/register">Register</Link>
            </p>
            <p className="quiz-gate-register-hint">
              <Link to="/admin/login">Admin sign in</Link>
            </p>
            <p className="start-wizard__footer">
              <span className="start-wizard__quill" aria-hidden="true">
                🪶
              </span>
              Test your knowledge. Earn your survival badge.
            </p>
          </div>
        </div>

        {loginOpen ? (
          <div
            className={`quiz-gate-login-layer${sheetVisible ? ' is-visible' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-gate-login-title"
          >
            <button type="button" className="quiz-gate-login-backdrop" aria-label="Close sign in" onClick={closeLogin} />
            <div className="quiz-gate-login-panel quiz-auth-card-host">
              <AuthQuizCardShell>
                <button type="button" className="auth-back-to-gate" onClick={closeLogin}>
                  ← Back
                </button>
                <LoginFormPanel
                  heading="Login"
                  submitLabel="Sign in"
                  headingId="quiz-gate-login-title"
                  showRegisterLink
                  onSuccess={handleLoggedIn}
                />
              </AuthQuizCardShell>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StartScreen() {
  const { startQuiz, state, restart } = useQuiz();
  const { user, isAdmin } = useAuth();
  const { isDarkMode, theme, toggleTheme } = useTheme();

  return (
    <div className="qf-screen start-screen">
      <div className="start-screen__bg-stack" aria-hidden="true">
        <div className="start-screen__bg-pane start-screen__bg-pane--night" />
        <div className="start-screen__bg-pane start-screen__bg-pane--day" />
        <div className="start-screen__bg-veil start-screen__bg-veil--night" />
        <div className="start-screen__bg-veil start-screen__bg-veil--day" />
      </div>
      <div className="start-screen__inner">
        <div className="start-screen-top start-screen-top--post-login">
          <nav className="quiz-top-links start-screen-top-links" aria-label="Quiz shortcuts">
            {!isAdmin ? (
              <>
                <Link className="quiz-top-link" to="/quiz" onClick={() => restart()}>
                  Quiz home
                </Link>
                <Link className="quiz-top-link" to="/history">
                  History
                </Link>
                <Link className="quiz-top-link" to="/leaderboard">
                  Leaderboard
                </Link>
              </>
            ) : (
              <NavLink
                className={({ isActive }) => `quiz-top-link${isActive ? ' quiz-top-link--active' : ''}`}
                to="/admin"
              >
                Admin
              </NavLink>
            )}
          </nav>
          <div className="start-screen-top__actions">
            <div className="mode-row">
              <span className="mode-lbl">{isDarkMode ? 'Night' : 'Day'}</span>
              <span className="mode-icon" aria-hidden="true">{isDarkMode ? '🌙' : '☀️'}</span>
              <button
                type="button"
                className="mode-sw"
                onClick={toggleTheme}
                aria-label={isDarkMode ? 'Switch to day mode' : 'Switch to night mode'}
                aria-pressed={!isDarkMode}
              >
                <span className="mode-kn" />
              </button>
            </div>
            <QuizTopPlayer user={user} />
            <QuizNavLogout />
          </div>
        </div>

        <div className="start-wizard">
          <div className="start-wizard__brand">
            <img
              key={theme}
              className="start-wizard__brand-img"
              src={quizStartHeroImageSrc(isDarkMode)}
              alt="Sydney Survival Quiz"
            />
          </div>
          <h1 className="start-wizard__title start-logo">
            Sydney Survival
            <em>Survival Quiz</em>
          </h1>
          <p className="start-wizard__tagline">
            <span className="start-wizard__star" aria-hidden="true">
              ✦
            </span>
            <span className="start-wizard__tagline-text">
              Ready to survive? Step in when you are—the city does not go easy on newcomers.
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
            <button type="button" className="btn-wizard-start" onClick={startQuiz}>
              <span className="btn-wizard-start__shine" aria-hidden="true" />
              Start Quiz
            </button>
          )}
          <p className="start-wizard__footer">
            <span className="start-wizard__quill" aria-hidden="true">
              🪶
            </span>
            Ten trials, one run—choose wisely, learn from every miss, and claim your survival badge.
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
    formatReviewCategory(currentQuestion?.category || currentQuestion?.topic || '') || 'Sydney Survival';

  return (
    <div className="qf-screen quiz-screen">
      <div className="quiz-gothic-shell">
        <GlobalHeader />
        <main className="quiz-gothic-main">
          <QuizProgressStrip total={n} current={currentQ} />

          <div className="quiz-gothic-topbar">
            <div className="gothic-ornament" aria-hidden="true">✦ ✦ ✦</div>
          </div>

          <section className="quiz-gothic-question">
            <div className="quiz-body">
              <div className="quiz-fade-wrap" key={currentQuestion?._id || currentQ}>
                <div className="quiz-slide">
                  <QuizFramedPanel className="active">
                    <div className={`mystic-feather-burst${featherBurst ? ' active' : ''}`} aria-hidden="true">
                      <span>🪶</span>
                      <span>✦</span>
                      <span>🪶</span>
                    </div>
                    <div className="q-meta">
                      <span className="q-num">Q{currentQ + 1}</span>
                      <TopicPill topic={currentTopic} />
                    </div>

                    <div className="q-text">{currentQuestion?.questionText}</div>

                    <div className="q-divider">◆ ◆ ◆</div>
                    <div className="q-hint"><span>🪶</span> Choose one correct answer.</div>

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
  const { state, showReview, startQuiz } = useQuiz();
  const { attemptScore, attemptTotal, review } = state;
  const ringRef = useRef(null);
  const confettiRef = useRef(null);

  const total = attemptTotal || review?.length || 10;
  const correct = typeof attemptScore === 'number' ? attemptScore : 0;
  const pct = Math.round((correct / total) * 100);
  const CIRC = 2 * Math.PI * 45;

  useEffect(() => {
    const color =
      pct >= 80 ? 'var(--sq-btn-b)' : pct >= 50 ? 'var(--sq-btn-a)' : '#E53935';
    const timer = setTimeout(() => {
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = `${CIRC * (1 - pct / 100)}`;
        ringRef.current.style.stroke = color;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [pct, CIRC]);

  useEffect(() => {
    if (pct < 60 || !confettiRef.current) return undefined;
    const colors = ['#FF8040', '#40B080', '#FFD700', '#FF6B9D', '#40C0FF', '#FF9D00', '#7FFF7F'];
    const count = pct >= 80 ? 70 : 35;
    const timers = [];

    for (let i = 0; i < count; i += 1) {
      timers.push(
        setTimeout(() => {
          if (!confettiRef.current) return;
          const p = document.createElement('div');
          const sz = 6 + Math.random() * 9;
          const col = colors[Math.floor(Math.random() * colors.length)];
          p.className = 'cpc';
          Object.assign(p.style, {
            left: `${Math.random() * 100}%`,
            top: '-14px',
            width: `${sz}px`,
            height: `${sz}px`,
            background: col,
            borderRadius: Math.random() > 0.5 ? '50%' : '4px',
            animationDuration: `${1.8 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 0.6}s`,
          });
          confettiRef.current.appendChild(p);
          setTimeout(() => p.remove(), 5000);
        }, i * 25),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [pct]);

  const topicMap = buildTopicMap(review, total, correct);

  const messages = [
    [100, 'Perfect Score! 🎯', 'You answered every question correctly.'],
    [80, 'Excellent! ⭐', `${correct} out of ${total} — outstanding work.`],
    [60, 'Good Job! ⭐', `${correct} correct. Open the debrief to review the rest.`],
    [40, 'Keep Going 🔍', `${correct} right. The explanations will help a lot.`],
    [0, 'Keep Practicing 💪', 'Read through the full debrief — flip every card.'],
  ];
  const [, msg, sub] = messages.find(([t]) => pct >= t);

  const heroHigh = pct >= 70;
  const handlePlayAgain = useCallback(() => {
    startQuiz();
  }, [startQuiz]);

  return (
    <div className="qf-screen result-screen result-v7">
      <div className="confetti-layer" ref={confettiRef} />
      <GlobalHeader />
      <main className="rv-main-v7 result-main-v7">
        <div className="rv-center">
          <div className="result-inner">
            <div className={`result-hero-icon${heroHigh ? ' is-high' : ' is-low'}`} aria-hidden="true">
              {heroHigh ? '🕊️' : '📜'}
            </div>

            <QuizFramedPanel className="result-stack">
          <div className="q-meta">
            <span className="q-num">Final score</span>
            <span className="q-cat topic-pill">Survival trial</span>
          </div>
          <div className="result-score-row">
            <div className="score-ring">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle className="sr-track" cx="55" cy="55" r="45" />
                <circle className="sr-fill" ref={ringRef} cx="55" cy="55" r="45" />
              </svg>
              <div className="score-ring-txt">
                <div className="score-ring-pct">{pct}%</div>
                <div className="score-ring-sub">Score</div>
              </div>
            </div>
            <div className="score-details">
              <div className="score-frac">
                {correct}
                <span>/{total}</span>
              </div>
              <div className="score-frac-hint">Final score · +1 per correct answer</div>
              <div className="score-msg">{msg}</div>
              <div className="score-sub">{sub}</div>
            </div>
          </div>

          <div className="q-divider">◆ ◆ ◆</div>
          <div className="q-hint result-topic-hint">
            <span aria-hidden="true">📊</span>
            Performance by topic
          </div>
          <div className="topic-grid">
            {Object.entries(topicMap).map(([name, { t: tgTotal, c }]) => {
              const frac = tgTotal ? c / tgTotal : 0;
              const col =
                frac === 1 ? 'var(--sq-btn-b)' : frac >= 0.5 ? 'var(--sq-btn-a)' : '#E53935';
              return (
                  <div key={name} className="tc-card">
                  <div className="tc-name">{formatReviewCategory(name) || name}</div>
                  <div className="tc-score" style={{ color: col }}>
                    {c}
                    /
                    {tgTotal}
                  </div>
                  <div className="tc-bar">
                    <div className="tc-fill" style={{ background: col, width: `${frac * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="result-actions">
            <div className="result-actions__btns">
              <button type="button" className="btn-debrief" onClick={showReview}>
                📋 Mission Debrief →
              </button>
              <button type="button" className="btn-again" onClick={handlePlayAgain}>
                ↺ Again
              </button>
            </div>
          </div>
            </QuizFramedPanel>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewV7Card({ item, index }) {
  const questionText = item.questionText;
  const options = item.options || [];
  const correctIdx = item.correctAnswer;
  const explanation = String(item.explanation ?? '').trim();
  const hasExplanation = Boolean(explanation);
  const isCorrect = item.isCorrect;
  /** Wrong: explanation open by default; correct: collapsed until user expands */
  const [expOpen, setExpOpen] = useState(() => !isCorrect && hasExplanation);

  const topicShort = (() => {
    const label = formatReviewCategory(item.category || item.topic || '');
    return label ? label.toUpperCase().replace(/\s+/g, ' ') : 'SYDNEY SURVIVAL';
  })();

  return (
    <QuizFramedPanel
      tag="article"
      id={`rvc-${index}`}
      className={`rv-card-v7 rv-card ${isCorrect ? 'card-cor' : 'card-wrg'}`}
    >
      <div className="rvc-head">
        <div className={`rvc-si ${isCorrect ? 'ok' : 'bad'}`}>{isCorrect ? '✓' : '✕'}</div>
        <span className="rvc-qn">Q{index + 1}</span>
        <span className="rvc-sep">·</span>
        <span className="rvc-topic">{topicShort}</span>
        <span className={`rvc-result ${isCorrect ? 'ok' : 'bad'}`}>{isCorrect ? 'Correct' : 'Incorrect'}</span>
      </div>
      <div className="rvc-body">
        <div className="rvc-q">{questionText}</div>
        <div className="q-divider rvc-q-divider">◆ ◆ ◆</div>
        <div className="rvc-opts">
          {options.map((opt, j) => {
            const isSel = j === item.selectedAnswer;
            const isCor = j === correctIdx;
            let cls = 'neutral';
            let tag = null;
            if (isCor && isSel) {
              cls = 'ok-ans';
              tag = <span className="rvc-opt-tag">Your Answer ✓</span>;
            } else if (isCor) {
              cls = 'ok-ans';
              tag = <span className="rvc-opt-tag">Correct</span>;
            } else if (isSel && !isCor) {
              cls = 'ur-bad';
              tag = <span className="rvc-opt-tag">Your Answer ✗</span>;
            }
            return (
              <div key={j} className={`rvc-opt ${cls}`}>
                <span className="rvc-ol">{LETTERS[j]}</span>
                {opt}
                {tag}
              </div>
            );
          })}
        </div>
      </div>
      {hasExplanation ? (
        <>
          <button
            type="button"
            className={`rvc-exp-btn${expOpen ? ' open' : ''}`}
            onClick={() => setExpOpen((o) => !o)}
            aria-expanded={expOpen}
          >
            <span className="exp-arrow" aria-hidden="true">▼</span>
            <span className="rvc-exp-label">{expOpen ? 'Hide Explanation' : 'View Explanation'}</span>
          </button>
          <div className={`rvc-exp-panel${expOpen ? ' open' : ''}`}>
            <div className="rvc-exp-lbl">
              <span aria-hidden="true">📜</span>
              Explanation
            </div>
            <p className="rvc-exp-text">{explanation}</p>
          </div>
        </>
      ) : (
        <div className="rvc-exp-block rvc-exp-block--empty">
          <div className="rvc-exp-lbl">
            <span aria-hidden="true">📜</span>
            Explanation
          </div>
          <p className="rvc-exp-text rvc-exp-missing">No explanation for this question.</p>
        </div>
      )}
    </QuizFramedPanel>
  );
}

export function ReviewScreen() {
  const { state, restart, backToResults } = useQuiz();
  const { review } = state;

  const safeReview = review || [];
  const correct = safeReview.filter((r) => r.isCorrect).length;
  const total = safeReview.length;
  const [activeDot, setActiveDot] = useState(0);

  const jumpTo = (i) => {
    setActiveDot(i);
    document.getElementById(`rvc-${i}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="qf-screen review-screen review-v7">
      <GlobalHeader />

      <div className="q-dot-bar">
        <span className="qdb-score" title="+1 point per correct answer">
          Final Score: {correct}/{total}
          <span className="qdb-score-sub"> (+1 each correct)</span>
        </span>
        <div className="qdb-dots" role="tablist" aria-label="Jump to question">
          {safeReview.map((row, i) => (
            <button
              key={row.questionId || i}
              type="button"
              className={`q-dot ${row.isCorrect ? 'cor' : 'wrg'}${activeDot === i ? ' active-dot' : ''}`}
              onClick={() => jumpTo(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button type="button" className="qdb-back" onClick={backToResults}>
          ← Results
        </button>
      </div>

      <main className="rv-main-v7">
        <div className="rv-center">
          <div className="rv-head-v7">
            <h1>
              Trial
              {' '}
              <em>Debrief</em>
            </h1>
            <div className="rv-final-score" role="status">
              <span className="rv-fs-label">Final score</span>
              <span className="rv-fs-value">
                {correct}
                <span className="rv-fs-slash">/</span>
                {total}
              </span>
              <span className="rv-fs-hint">+1 point per correct answer</span>
            </div>
            <p>
              Correct answers keep the explanation collapsed — use View Explanation to read it. Incorrect answers show
              the explanation by default; use Hide Explanation to collapse it.
            </p>
          </div>
          <div className="rv-cards-v7">
            {safeReview.map((row, i) => (
              <ReviewV7Card
                key={row.questionId || i}
                item={row}
                index={i}
              />
            ))}
          </div>
          <div className="rv-v7-footer-actions">
            <button type="button" className="btn-rv-again" onClick={restart}>
              ↺ Play Again
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
