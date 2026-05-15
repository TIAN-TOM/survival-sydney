/**
 * Deterministic option shuffle keyed by question _id so:
 * - GET /quiz/start and POST /quiz/submit (and review) all see the same order
 * - No session storage required
 *
 * Uses Fisher–Yates (not `sort(() => Math.random() - 0.5)`, which is biased).
 */

function seedFromObjectId(id) {
  const hex = id && id.toString ? id.toString() : String(id);
  let n = 0;
  for (let i = 0; i < hex.length; i += 1) {
    n = (Math.imul(31, n) + hex.charCodeAt(i)) >>> 0;
  }
  return n || 1;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {{ _id: unknown, questionText: string, options: string[], correctAnswer: number, topic?: string, explanation?: string }} question
 * @returns {{ _id: unknown, questionText: string, options: string[], correctAnswer: number, topic: string, explanation?: string }}
 */
function shuffleQuestion(question) {
  const opts = (question.options || []).map((o) => String(o));
  const correctIdx = question.correctAnswer;

  const deck = opts.map((option, index) => ({
    option,
    isCorrect: index === correctIdx,
  }));

  const rand = mulberry32(seedFromObjectId(question._id));
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }

  return {
    _id: question._id,
    questionText: question.questionText,
    options: deck.map((x) => x.option),
    correctAnswer: deck.findIndex((x) => x.isCorrect),
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

module.exports = { shuffleQuestion, toStartQuizPayload };
