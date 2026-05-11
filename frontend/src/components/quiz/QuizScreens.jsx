import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { useQuiz } from '../../contexts/QuizContext.jsx';

const QUIZ_KANGAROO_JUMP_MS = 620;

const LETTERS = ['A', 'B', 'C', 'D'];

const TOPIC_MAP = {
  Geography: { cls: 'tp-geo', label: 'Geography' },
  Technology: { cls: 'tp-tech', label: 'Technology' },
  Science: { cls: 'tp-sci', label: 'Science' },
  Knowledge: { cls: 'tp-know', label: 'Knowledge' },
  Logic: { cls: 'tp-log', label: 'Logic' },
  Riddle: { cls: 'tp-rid', label: 'Riddle 🧩' },
};

const JOURNEY_STOP_POOL = [
  { icon: '🚢', label: 'Circular Quay' },
  { icon: '🏛️', label: 'Opera House' },
  { icon: '🌉', label: 'Harbour Bridge' },
  { icon: '🚌', label: 'Bus Stop' },
  { icon: '🏖️', label: 'Bondi' },
  { icon: '🦁', label: 'Taronga Zoo' },
  { icon: '🌿', label: 'Botanic Gardens' },
  { icon: '⛴️', label: 'Manly Ferry' },
  { icon: '🏙️', label: 'CBD' },
  { icon: '🎪', label: 'Luna Park' },
];

function stopsForCount(n) {
  if (n <= JOURNEY_STOP_POOL.length) return JOURNEY_STOP_POOL.slice(0, Math.max(0, n));
  const out = [...JOURNEY_STOP_POOL];
  while (out.length < n) {
    out.push({ icon: '📍', label: `Stop ${out.length + 1}` });
  }
  return out.slice(0, n);
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
  const cardRefs = useRef([]);
  const kangarooRef = useRef(null);

  useEffect(() => {
    if (currentQ > 0 && currentQ < questions.length) {
      const el = cardRefs.current[currentQ];
      if (!el) return undefined;
      const id = requestAnimationFrame(() => {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [currentQ, questions.length]);

  useEffect(() => {
    const el = kangarooRef.current;
    if (!el || currentQ < 1) return undefined;
    el.classList.remove('quiz-kangaroo--jump');
    void el.offsetWidth;
    el.classList.add('quiz-kangaroo--jump');
    const t = window.setTimeout(() => {
      el.classList.remove('quiz-kangaroo--jump');
    }, QUIZ_KANGAROO_JUMP_MS);
    return () => clearTimeout(t);
  }, [currentQ]);

  const handleSelect = useCallback(
    (cardIdx, optIdx) => {
      if (answered || cardIdx !== currentQ) return;

      lockAnswer();

      setTimeout(() => {
        submitAnswer(optIdx);
      }, 480);
    },
    [answered, currentQ, lockAnswer, submitAnswer],
  );

  const getCardState = (i) => {
    if (i < currentQ) return 'answered';
    if (i === currentQ) return 'active';
    return 'locked';
  };

  const n = questions.length;

  return (
    <div className="qf-screen quiz-screen">
      <JourneyStrip total={n} current={currentQ} />

      <div className="quiz-body">
        {questions.map((q, i) => {
          const cardState = getCardState(i);
          const savedAnswer = answers[i];

          const topicLabel = q.category || q.topic || 'Sydney Life';

          return (
            <div
              key={q._id || i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`q-card ${cardState}`}
            >
              <div className="q-meta">
                <span className="q-num">
                  Question {i + 1} / {questions.length}
                </span>
                <TopicPill topic={topicLabel} />
              </div>

              <div className="q-text">{q.questionText}</div>

              <div className="q-hint">Pick one answer</div>

              <div className="opts">
                {(q.options || []).map((opt, j) => {
                  const isSelected = savedAnswer?.sel === j;
                  return (
                    <button
                      key={j}
                      type="button"
                      className={`opt ${isSelected ? 'selected' : ''}`}
                      disabled={cardState !== 'active' || answered}
                      onClick={() => handleSelect(i, j)}
                    >
                      <span className="opt-badge">{LETTERS[j]}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="quiz-kangaroo" ref={kangarooRef} aria-hidden="true">
        <img src="/Kangaroo.png" alt="" width="132" height="132" />
      </div>
    </div>
  );
}

export function CalculatingScreen() {
  return (
    <div className="qf-screen calculating-screen">
      <div className="calc-inner">
        <div className="calc-roo" aria-hidden="true">
          🦘
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
          🦘
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

function FlipCard({ item, index }) {
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const flipped = useRef(false);

  const flip = () => {
    const from = flipped.current ? backRef.current : frontRef.current;
    const to = flipped.current ? frontRef.current : backRef.current;
    const toBack = !flipped.current;

    from.style.opacity = '0';
    from.style.transform = `rotateY(${toBack ? '90deg' : '-90deg'}) scale(.98)`;

    setTimeout(() => {
      from.style.display = 'none';
      from.style.opacity = '';
      from.style.transform = '';
      to.style.display = 'block';
      to.style.opacity = '0';
      to.style.transform = `rotateY(${toBack ? '-90deg' : '90deg'}) scale(.98)`;
      flipped.current = !flipped.current;

      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          to.style.opacity = '1';
          to.style.transform = 'rotateY(0deg) scale(1)';
        }),
      );
    }, 190);
  };

  const questionText = item.questionText;
  const options = item.options || [];
  const correctIdx = item.correctAnswer;
  const explanation = item.explanation || '';
  const topic = item.category || item.topic || 'Sydney Life';
  const isCorrect = item.isCorrect;

  return (
    <div className="rv-card" id={`rvc-${index}`}>
      <div ref={frontRef} className="fc-front">
        <div className="fc-head">
          <div className={`fc-si ${isCorrect ? 'ok' : 'bad'}`}>{isCorrect ? '✓' : '✕'}</div>
          <div className="fc-q-lbl">
            Q{index + 1}
            {' '}
            ·
            {' '}
            <TopicPill topic={topic} style={{ fontSize: '.55rem', padding: '.15rem .52rem' }} />
          </div>
          {explanation ? (
            <button type="button" className="flip-btn" onClick={flip}>
              📖 Explanation →
            </button>
          ) : null}
        </div>
        <div className="fc-body">
          <div className="fc-q-txt">{questionText}</div>
          <div className="fc-opts">
            {options.map((opt, j) => {
              const isSel = j === item.selectedAnswer;
              const isCor = j === correctIdx;
              let cls = 'neutral';
              let tag = null;
              if (isCor && isSel) {
                cls = 'ok-ans';
                tag = <span className="fc-opt-tag">Your Answer ✓</span>;
              } else if (isCor) {
                cls = 'ok-ans';
                tag = <span className="fc-opt-tag">Correct</span>;
              } else if (isSel && !isCor) {
                cls = 'ur-bad';
                tag = <span className="fc-opt-tag">Your Answer ✗</span>;
              }
              return (
                <div key={j} className={`fc-opt ${cls}`}>
                  <span className="fc-ol">{LETTERS[j]}</span>
                  {opt}
                  {tag}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {explanation ? (
        <div ref={backRef} className="fc-back" style={{ display: 'none' }}>
          <div className="fc-back-head">
            <div className="fc-back-lbl">
              📖 Explanation — Q{index + 1}
            </div>
            <button type="button" className="flip-back-btn" onClick={flip}>
              ← Answer
            </button>
          </div>
          <div className="fc-back-body">
            <p className="fc-exp-txt">{explanation}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ReviewScreen() {
  const { state, restart, backToResults } = useQuiz();
  const { review } = state;

  const safeReview = review || [];
  const correct = safeReview.filter((r) => r.isCorrect).length;

  const jumpTo = (i) => {
    document.getElementById(`rvc-${i}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="qf-screen review-screen">
      <aside className="rv-sidebar">
        <div className="rv-sb-title">Debrief</div>
        <div className="rv-sb-sub">Mission Review</div>

        <div className="rv-summary">
          <div className="rv-sum-chip">
            <div className="rv-sum-n c">{correct}</div>
            <div className="rv-sum-l">Correct</div>
          </div>
          <div className="rv-sum-chip">
            <div className="rv-sum-n w">{safeReview.length - correct}</div>
            <div className="rv-sum-l">Wrong</div>
          </div>
          <div className="rv-sum-chip">
            <div className="rv-sum-n t">{safeReview.length}</div>
            <div className="rv-sum-l">Total</div>
          </div>
        </div>

        <div className="rv-nav">
          {safeReview.map((row, i) => (
            <button key={row.questionId || i} type="button" className="rv-nav-btn" onClick={() => jumpTo(i)}>
              <span className={`rv-dot ${row.isCorrect ? 'c' : 'w'}`} />
              <span className="rv-nav-txt">
                Q{i + 1}. {(row.questionText || '').slice(0, 30)}…
              </span>
            </button>
          ))}
        </div>

        <div className="rv-back-wrap">
          <button type="button" className="btn-rv-back" onClick={backToResults}>
            ← Back to Results
          </button>
          <button type="button" className="btn-rv-again" onClick={restart}>
            ↺ Play Again
          </button>
        </div>
      </aside>

      <main className="rv-main">
        <div className="rv-main-head">
          <h1>Mission Debrief 📋</h1>
          <p>All answers revealed. Flip any card to read the explanation.</p>
        </div>
        <div className="rv-cards">
          {safeReview.map((row, i) => (
            <FlipCard key={row.questionId || i} item={row} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
