// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// signed quiz-attempt token helpers for per-attempt option ordering.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { getJwtSecret } = require('../config/auth');
const { ATTEMPT_TOKEN_TTL_SECONDS, QUIZ_LENGTH } = require('../config/quiz');
const { isValidPermutation } = require('./shuffleQuestion');

function tokenError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function signAttemptToken({ userId, questions }) {
  // The attempt token binds this user to one exact question set and option order.
  if (!userId) {
    throw new Error('signAttemptToken: userId is required');
  }

  if (!Array.isArray(questions) || questions.length !== QUIZ_LENGTH) {
    throw new Error(`signAttemptToken: expected exactly ${QUIZ_LENGTH} questions`);
  }

  for (const q of questions) {
    if (!q || !q._id) {
      throw new Error('signAttemptToken: question _id is required');
    }

    if (!mongoose.Types.ObjectId.isValid(String(q._id))) {
      throw new Error('signAttemptToken: invalid question _id');
    }

    if (!isValidPermutation(q.optionOrder)) {
      throw new Error('signAttemptToken: optionOrder must be permutation of 0..3');
    }
  }

  const qids = questions.map(q => String(q._id));
  if (new Set(qids).size !== QUIZ_LENGTH) {
    throw new Error('signAttemptToken: duplicate question IDs');
  }

  const attemptId = crypto.randomUUID();
  // purpose separates quiz-attempt tokens from normal login JWTs that use the same signing library.
  const payload = {
    purpose: 'quiz_attempt',
    userId: String(userId),
    attemptId,
    items: questions.map(q => ({ qid: String(q._id), order: q.optionOrder })),
  };

  const token = jwt.sign(payload, getJwtSecret(), {
    expiresIn: ATTEMPT_TOKEN_TTL_SECONDS,
  });

  return { attemptId, token };
}

function verifyAttemptToken(token, expectedUserId) {
  let decoded;

  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (err) {
    // Expired attempts are reported separately so submit can show the right user-facing message.
    throw tokenError(err.name === 'TokenExpiredError' ? 'expired' : 'invalid');
  }

  if (decoded.purpose !== 'quiz_attempt') {
    throw tokenError('invalid');
  }

  if (decoded.userId !== String(expectedUserId)) {
    throw tokenError('wrong_user');
  }

  if (typeof decoded.attemptId !== 'string' || decoded.attemptId.length === 0) {
    throw tokenError('invalid');
  }

  if (!Array.isArray(decoded.items) || decoded.items.length !== QUIZ_LENGTH) {
    throw tokenError('invalid');
  }

  for (const item of decoded.items) {
    if (!item || typeof item.qid !== 'string' || !mongoose.Types.ObjectId.isValid(item.qid)) {
      throw tokenError('invalid');
    }

    if (!isValidPermutation(item.order)) {
      throw tokenError('invalid');
    }
  }

  const qids = decoded.items.map(item => item.qid);
  // Duplicate IDs would make scoring ambiguous, so the signed contract must contain exactly 10 unique questions.
  if (new Set(qids).size !== QUIZ_LENGTH) {
    throw tokenError('invalid');
  }

  return decoded;
}

module.exports = { signAttemptToken, verifyAttemptToken };
