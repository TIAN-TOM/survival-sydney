import { OPTIONS_PER_QUESTION } from '../config/quiz';

/**
 * Per-attempt option order helpers.
 *
 * The generated permutation is signed into the quiz attempt token at /quiz/start
 * and persisted to Score.answers[i].optionOrder on submit so review/history can
 * render the same order the player saw.
 */

/** Minimal question shape applyOptionOrder needs (Mongoose docs and plain objects both fit). */
export interface ShuffleSourceQuestion {
  _id?: unknown;
  questionText: string;
  options: string[];
  correctAnswer: number;
  topic?: string;
  explanation?: string;
}

export interface ShuffledQuestion {
  _id: unknown;
  questionText: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  explanation?: string;
}

export interface StartQuizQuestion {
  _id: unknown;
  questionText: string;
  options: string[];
  topic: string;
}

function isValidPermutation(arr: unknown): arr is number[] {
  return (
    Array.isArray(arr) &&
    arr.length === OPTIONS_PER_QUESTION &&
    new Set(arr).size === OPTIONS_PER_QUESTION &&
    arr.every(n => Number.isInteger(n) && n >= 0 && n < OPTIONS_PER_QUESTION)
  );
}

function generateOptionOrder(randomFn: () => number = Math.random): number[] {
  // Fisher-Yates style shuffle: produces one visible option order for this attempt only.
  const order = Array.from({ length: OPTIONS_PER_QUESTION }, (_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return order;
}

function applyOptionOrder(question: ShuffleSourceQuestion, order: number[]): ShuffledQuestion {
  if (!isValidPermutation(order)) {
    throw new Error('optionOrder must be a permutation of 0..3');
  }

  const opts = (question.options || []).map((o) => String(o));
  const correctIdx = question.correctAnswer;

  return {
    _id: question._id,
    questionText: question.questionText,
    options: order.map(index => opts[index]),
    // correctAnswer is converted into the visible shuffled index for review display.
    correctAnswer: order.indexOf(correctIdx),
    topic: question.topic || 'general',
    explanation: question.explanation,
  };
}

/** Strip server-only fields for quiz start response. */
function toStartQuizPayload(shuffled: ShuffledQuestion): StartQuizQuestion {
  return {
    _id: shuffled._id,
    questionText: shuffled.questionText,
    options: shuffled.options,
    topic: shuffled.topic,
  };
}

export {
  generateOptionOrder,
  applyOptionOrder,
  isValidPermutation,
  toStartQuizPayload,
};
