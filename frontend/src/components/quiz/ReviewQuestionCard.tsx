import { useState } from 'react';

import type { ReviewRow } from '../../types.ts';
import { BRAND } from '../../config/brand.ts';
import { formatReviewCategory } from './reviewFormatUtils.ts';

const LETTERS = ['A', 'B', 'C', 'D'];

function optionVariant(sel: number | null, correctIdx: number | null, j: number) {
  const isCor = typeof correctIdx === 'number' && j === correctIdx;
  const isSel = typeof sel === 'number' && j === sel;
  if (isCor && isSel) return 'correct';
  if (isCor) return 'correct';
  if (isSel) return 'wrong-pick';
  return 'neutral';
}

function optionBadge(sel: number | null, correctIdx: number | null, j: number) {
  const isCor = typeof correctIdx === 'number' && j === correctIdx;
  const isSel = typeof sel === 'number' && j === sel;
  if (isCor) return 'Correct answer';
  if (isSel && !isCor) return 'Your answer';
  return null;
}

export default function ReviewQuestionCard({ item, index }: { item: ReviewRow; index: number }) {
  const questionText = item.questionText;
  const options = item.options || [];
  const correctIdx = item.correctAnswer;
  const explanation = String(item.explanation ?? '').trim();
  const hasExplanation = Boolean(explanation);
  const isCorrect = item.isCorrect;
  /** Wrong: explanation open by default; correct: collapsed until user expands */
  const [expOpen, setExpOpen] = useState(() => !isCorrect && hasExplanation);

  const sel = item.selectedAnswer;

  const categoryLabel = formatReviewCategory(item.category || item.topic || '') || BRAND.defaultTopicLabel;

  const learningLine = isCorrect
    ? 'Well judged — carry this instinct into real decisions on the ground.'
    : 'Treat this as a rehearsal: anchor the explanation below, then try a fresh run when ready.';

  return (
    <article
      id={`rvc-${index}`}
      className={`hist-attempt-card review-q-card ${isCorrect ? 'review-q-card--correct' : 'review-q-card--wrong'}`}
      style={{ '--motion-stagger-index': index }}
    >
      <header className="hist-attempt-head">
        <span className="hist-attempt-no" aria-label={`Question ${index + 1}`}>
          {index + 1}
        </span>
        <h2 className="hist-attempt-title">{categoryLabel}</h2>
        <div className="hist-attempt-badges">
          <span className={`hist-badge ${isCorrect ? '' : 'hist-badge--wrong'}`}>
            {isCorrect ? 'Correct' : 'Incorrect'}
          </span>
        </div>
      </header>

      <div className="review-q-block review-q-block--question">
        <span className="review-q-kicker">Scenario</span>
        <p className="review-q-text">{questionText}</p>
      </div>

      <div className="review-q-block review-q-block--choices">
        <span className="review-q-kicker">Answer choices</span>
        {options.length === 0 ? (
          <p className="review-q-opt-empty">No choices recorded for this item.</p>
        ) : (
          <ul className="review-q-opt-list">
            {options.map((opt, j) => {
              const variant = optionVariant(sel, correctIdx, j);
              const badge = optionBadge(sel, correctIdx, j);
              return (
                <li key={j} className={`review-q-opt review-q-opt--${variant}`}>
                  <div className="review-q-opt-main">
                    <span className="review-q-letter" aria-hidden="true">
                      {LETTERS[j]}
                    </span>
                    <span className="review-q-opt-body">{opt}</span>
                  </div>
                  <div className="review-q-opt-status">
                    {badge ? (
                      <span className={`review-q-opt-badge review-q-opt-badge--${variant}`}>{badge}</span>
                    ) : (
                      <span className="review-q-opt-status-placeholder" aria-hidden="true" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="review-q-feedback">{learningLine}</p>

      <div className="review-q-divider" aria-hidden="true" />

      {hasExplanation ? (
        <>
          <button
            type="button"
            className={`rvc-exp-btn${expOpen ? ' open' : ''}`}
            onClick={() => setExpOpen((o) => !o)}
            aria-expanded={expOpen}
          >
            <span className="exp-arrow" aria-hidden="true">
              ▼
            </span>
            <span className="rvc-exp-label">{expOpen ? 'Hide scholar note' : 'View scholar note'}</span>
          </button>
          <div className={`rvc-exp-panel${expOpen ? ' open' : ''}`}>
            <div className="rvc-exp-panel-inner">
              <div className="rvc-exp-lbl">Scholar's explanation</div>
              <p className="rvc-exp-text">{explanation}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="rvc-exp-block rvc-exp-block--empty">
          <div className="rvc-exp-lbl">Scholar's explanation</div>
          <p className="rvc-exp-text rvc-exp-missing">No written note accompanies this item.</p>
        </div>
      )}
    </article>
  );
}
