// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// signed quiz-attempt token helpers for per-attempt option ordering.
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { getJwtSecret, JWT_ALGORITHM } from '../config/auth';
import { ATTEMPT_TOKEN_TTL_SECONDS, QUIZ_LENGTH } from '../config/quiz';
import { isValidPermutation } from './shuffleQuestion';

export type AttemptTokenErrorCode = 'expired' | 'invalid' | 'wrong_user';

/** Verification failure carrying a machine-readable code the controller maps to a client message. */
export class AttemptTokenError extends Error {
  readonly code: AttemptTokenErrorCode;

  constructor(code: AttemptTokenErrorCode) {
    super(code);
    this.code = code;
  }
}

function tokenError(code: AttemptTokenErrorCode): AttemptTokenError {
  return new AttemptTokenError(code);
}

export interface AttemptTokenItem {
  qid: string;
  order: number[];
}

/** Claims signed into a quiz-attempt token; `purpose` separates it from session JWTs. */
export interface AttemptTokenPayload {
  purpose: 'quiz_attempt';
  userId: string;
  attemptId: string;
  items: AttemptTokenItem[];
}

interface SignAttemptTokenInput {
  userId: unknown;
  questions: Array<{ _id: unknown; optionOrder: number[] }>;
}

function signAttemptToken({ userId, questions }: SignAttemptTokenInput): { attemptId: string; token: string } {
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
  const payload: AttemptTokenPayload = {
    purpose: 'quiz_attempt',
    userId: String(userId),
    attemptId,
    items: questions.map(q => ({ qid: String(q._id), order: q.optionOrder })),
  };

  const token = jwt.sign(payload, getJwtSecret(), {
    expiresIn: ATTEMPT_TOKEN_TTL_SECONDS,
    algorithm: JWT_ALGORITHM,
  });

  return { attemptId, token };
}

function verifyAttemptToken(token: string, expectedUserId: unknown): AttemptTokenPayload {
  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });
  } catch (err) {
    // Expired attempts are reported separately so submit can show the right user-facing message.
    throw tokenError(err instanceof Error && err.name === 'TokenExpiredError' ? 'expired' : 'invalid');
  }

  // Our tokens always carry object claims, so a bare-string payload is foreign and invalid.
  if (typeof decoded === 'string' || decoded.purpose !== 'quiz_attempt') {
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

  // Safe narrowing: every claim was validated above (purpose, userId, attemptId, items).
  return decoded as AttemptTokenPayload;
}

export { signAttemptToken, verifyAttemptToken };
