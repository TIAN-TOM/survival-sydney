import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext.jsx';
import { useQuiz } from '../../contexts/QuizContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const QUIZ_ADVANCE_DELAY_MS = 860;

const LETTERS = ['A', 'B', 'C', 'D'];

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

export function StartScreen() {
  const { startQuiz, state } = useQuiz();

  return (
    <div className="qf-screen start-screen">
      <div className="start-hero">
        <div className="start-left">
          <div className="start-eyebrow">Sydney Student Life</div>
          <h1 className="start-title">
            SYDNEY
            <em>LIFE QUIZ</em>
          </h1>
          <p className="start-sub">
            Can you survive Sydney as an international student? Real-life scenarios. No hints during play.
            Review everything after with full explanations.
          </p>
          <div className="start-stats">
            <div className="stat-bubble">
              <div className="stat-n">10</div>
              <div className="stat-l">Questions</div>
            </div>
            <div className="stat-bubble">
              <div className="stat-n">🏆</div>
              <div className="stat-l">Leaderboard</div>
            </div>
            <div className="stat-bubble">
              <div className="stat-n">∞</div>
              <div className="stat-l">Review</div>
            </div>
          </div>
          {state.error && (
            <p className="start-error">{state.error}</p>
          )}
          <button type="button" className="btn-start" onClick={startQuiz}>
            Start Quiz <span className="btn-arrow">→</span>
          </button>
        </div>

        <div className="start-deco" aria-hidden="true">
          <div className="start-deco-ring">
            <span className="start-deco-emoji">🌉</span>
          </div>
          <p className="start-deco-cap">Harbour & campus vibes</p>
        </div>
      </div>
    </div>
  );
}

export function QuizScreen() {
  const { state, lockAnswer, submitAnswer } = useQuiz();
  const { questions, currentQ, answers, answered } = state;
  const { isDarkMode, toggleTheme } = useTheme();
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [featherBurst, setFeatherBurst] = useState(false);

  useEffect(() => {
    setPendingAnswer(null);
    setFeatherBurst(false);
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
  const currentTopic = currentQuestion?.category || currentQuestion?.topic || 'Sydney Life';

  return (
    <div className="qf-screen quiz-screen">
      <div className="quiz-gothic-shell">
        <div className="quiz-top-navbar">
          <a className="quiz-top-logo" href="/">
            <span className="quiz-top-logo-seal" aria-hidden="true">📜</span>
            Sydney Life Quiz
          </a>
          <div className="quiz-top-links">
            <Link className="quiz-top-link" to="/history">History</Link>
            <Link className="quiz-top-link" to="/leaderboard">Leaderboard</Link>
          </div>
          <div className="quiz-top-right">
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
        </div>
        <main className="quiz-gothic-main">
          <QuizProgressStrip total={n} current={currentQ} />

          <div className="quiz-gothic-topbar">
            <div className="gothic-ornament" aria-hidden="true">✦ ✦ ✦</div>
          </div>

          <section className="quiz-gothic-question">
            <div className="quiz-body">
              <div className="quiz-fade-wrap" key={currentQuestion?._id || currentQ}>
                <div className="quiz-slide">
                  <div className="q-card framed active">
                    <div className={`mystic-feather-burst${featherBurst ? ' active' : ''}`} aria-hidden="true">
                      <span>🪶</span>
                      <span>✦</span>
                      <span>🪶</span>
                    </div>
                    <svg className="bracket tl" viewBox="0 0 20 20" width="20" height="20">
                      <polyline points="19,1 1,1 1,19" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
                    </svg>
                    <svg className="bracket tr" viewBox="0 0 20 20" width="20" height="20">
                      <polyline points="1,1 19,1 19,19" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
                    </svg>
                    <svg className="bracket bl" viewBox="0 0 20 20" width="20" height="20">
                      <polyline points="19,19 1,19 1,1" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
                    </svg>
                    <svg className="bracket br" viewBox="0 0 20 20" width="20" height="20">
                      <polyline points="1,19 19,19 19,1" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
                    </svg>
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
                        return (
                          <button
                            key={j}
                            type="button"
                            className={`opt ${isSelected ? 'selected' : ''}`}
                            disabled={answered}
                            onClick={() => handleSelect(currentQ, j)}
                          >
                            <span className="opt-badge">{LETTERS[j]}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
  const { state, showReview, restart } = useQuiz();
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

  return (
    <div className="qf-screen result-screen">
      <div className="confetti-layer" ref={confettiRef} />
      <div className="result-inner">
        <div className={`result-hero-icon${heroHigh ? ' is-high' : ' is-low'}`} aria-hidden="true">
          {heroHigh ? '🦉' : '📜'}
        </div>

        <div className="result-card">
          <div className="result-mission-lbl">✦ Quiz Complete ✦</div>
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
              <div className="score-msg">{msg}</div>
              <div className="score-sub">{sub}</div>
            </div>
          </div>

          <div className="topic-heading">Performance by Topic</div>
          <div className="topic-grid">
            {Object.entries(topicMap).map(([name, { t: tgTotal, c }]) => {
              const frac = tgTotal ? c / tgTotal : 0;
              const col =
                frac === 1 ? 'var(--sq-btn-b)' : frac >= 0.5 ? 'var(--sq-btn-a)' : '#E53935';
              return (
                <div key={name} className="tc-card">
                  <div className="tc-name">{name}</div>
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
            <button type="button" className="btn-debrief" onClick={showReview}>
              📋 Mission Debrief →
            </button>
            <button type="button" className="btn-again" onClick={restart}>
              ↺ Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewV7Card({ item, index, explanationOpenIndex, onToggleExplanation }) {
  const questionText = item.questionText;
  const options = item.options || [];
  const correctIdx = item.correctAnswer;
  const explanation = String(item.explanation ?? '').trim();
  const hasExplanation = Boolean(explanation);
  const topic = item.category || item.topic || 'Sydney Life';
  const isCorrect = item.isCorrect;
  const topicShort = String(topic).toUpperCase();
  const open = hasExplanation && explanationOpenIndex === index;

  return (
    <div className={`rv-card-v7 rv-card ${isCorrect ? 'card-cor' : 'card-wrg'}`} id={`rvc-${index}`}>
      <div className="rvc-head">
        <div className={`rvc-si ${isCorrect ? 'ok' : 'bad'}`}>{isCorrect ? '✓' : '✕'}</div>
        <span className="rvc-qn">Q{index + 1}</span>
        <span className="rvc-sep">·</span>
        <span className="rvc-topic">{topicShort}</span>
        <span className={`rvc-result ${isCorrect ? 'ok' : 'bad'}`}>{isCorrect ? 'Correct' : 'Incorrect'}</span>
      </div>
      <div className="rvc-body">
        <div className="rvc-q">{questionText}</div>
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
      <button
        type="button"
        className={`rvc-exp-btn${open ? ' open' : ''}`}
        disabled={!hasExplanation}
        onClick={() => onToggleExplanation(index)}
        aria-expanded={hasExplanation ? open : undefined}
      >
        <span className="exp-arrow" aria-hidden="true">▼</span>
        <span className="rvc-exp-label">
          {!hasExplanation
            ? 'No explanation for this trial'
            : open
              ? 'Hide Explanation'
              : 'View Explanation'}
        </span>
      </button>
      {hasExplanation ? (
        <div className={`rvc-exp-panel${open ? ' open' : ''}`}>
          <div className="rvc-exp-lbl">
            <span aria-hidden="true">📜</span>
            Explanation
          </div>
          <p className="rvc-exp-text">{explanation}</p>
        </div>
      ) : null}
    </div>
  );
}

export function ReviewScreen() {
  const { state, restart, backToResults } = useQuiz();
  const { review } = state;
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const safeReview = review || [];
  const correct = safeReview.filter((r) => r.isCorrect).length;
  const total = safeReview.length;
  const [activeDot, setActiveDot] = useState(0);
  const [explanationOpenIndex, setExplanationOpenIndex] = useState(null);

  const initials = (user?.username || 'P').slice(0, 1).toUpperCase();

  const jumpTo = (i) => {
    setActiveDot(i);
    setExplanationOpenIndex(null);
    document.getElementById(`rvc-${i}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const toggleExplanation = useCallback((i) => {
    const row = safeReview[i];
    if (!String(row?.explanation ?? '').trim()) return;

    setExplanationOpenIndex((cur) => {
      if (cur === i) return null;
      requestAnimationFrame(() => {
        document.getElementById(`rvc-${i}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
      return i;
    });
  }, [safeReview]);

  return (
    <div className="qf-screen review-screen review-v7">
      <div className="quiz-top-navbar">
        <Link className="quiz-top-logo" to="/">
          <span className="quiz-top-logo-seal" aria-hidden="true">🕯️</span>
          SYDNEY LIFE QUIZ
        </Link>
        <div className="quiz-top-right">
          <div className="review-v7-player">
            <span className="review-v7-av" aria-hidden="true">{initials}</span>
            <span className="review-v7-pname">{user?.username || 'player'}</span>
          </div>
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
      </div>

      <div className="q-dot-bar">
        <span className="qdb-score">
          {correct}
          /
          {total}
          {' '}
          Correct
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
            <p>All answers revealed. Click ▼ on any card to read the explanation.</p>
          </div>
          <div className="rv-cards-v7">
            {safeReview.map((row, i) => (
              <ReviewV7Card
                key={row.questionId || i}
                item={row}
                index={i}
                explanationOpenIndex={explanationOpenIndex}
                onToggleExplanation={toggleExplanation}
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
