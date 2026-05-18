const { OPTIONS_PER_QUESTION } = require('../config/quiz');

/**
 * Per-attempt option order helpers.
 *
 * The generated permutation is signed into the quiz attempt token at /quiz/start
 * and persisted to Score.answers[i].optionOrder on submit so review/history can
 * render the same order the player saw.
 */

function isValidPermutation(arr) {
  return (
    Array.isArray(arr) &&
    arr.length === OPTIONS_PER_QUESTION &&
    new Set(arr).size === OPTIONS_PER_QUESTION &&
    arr.every(n => Number.isInteger(n) && n >= 0 && n < OPTIONS_PER_QUESTION)
  );
}

function generateOptionOrder(randomFn = Math.random) {
  const order = Array.from({ length: OPTIONS_PER_QUESTION }, (_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return order;
}

/**
 * @param {{ _id: unknown, questionText: string, options: string[], correctAnswer: number, topic?: string, explanation?: string }} question
 * @param {number[]} order
 * @returns {{ _id: unknown, questionText: string, options: string[], correctAnswer: number, topic: string, explanation?: string }}
 */
function applyOptionOrder(question, order) {
  if (!isValidPermutation(order)) {
    throw new Error('optionOrder must be a permutation of 0..3');
  }

  const opts = (question.options || []).map((o) => String(o));
  const correctIdx = question.correctAnswer;

  return {
    _id: question._id,
    questionText: question.questionText,
    options: order.map(index => opts[index]),
    correctAnswer: order.indexOf(correctIdx),
    topic: question.topic || 'general',
    explanation: question.explanation,
  };
}

/** Strip server-only fields for quiz start response. */
function toStartQuizPayload(shuffled) {
  return {
    _id: shuffled._id,
    questionText: shuffled.questionText,
    options: shuffled.options,
    topic: shuffled.topic,
  };
}

module.exports = {
  generateOptionOrder,
  applyOptionOrder,
  isValidPermutation,
  toStartQuizPayload,
};
