// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// end-to-end backend API coverage aligned with the current dev API surface.
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

const TEST_MONGODB_URI = 'mongodb://localhost:27017/comp5347_quiz_api_test';

process.env.JWT_SECRET = 'test-only-jwt-secret-value-at-least-32-chars';
process.env.JWT_EXPIRES_IN = '2h';
process.env.BCRYPT_ROUNDS = '4';
process.env.MONGODB_URI = TEST_MONGODB_URI;

import app from '../app';
import Attempt from '../models/Attempt';
import Question, { QuestionDocument } from '../models/Question';
import Score from '../models/Score';
import User, { UserDocument } from '../models/User';
import { getJwtSecret, JWT_ALGORITHM } from '../config/auth';
import { API_TITLE } from '../config/brand';
import { QUIZ_LENGTH, OPTIONS_PER_QUESTION } from '../config/quiz';
import {
  applyOptionOrder,
  generateOptionOrder,
  isValidPermutation,
} from '../utils/shuffleQuestion';
import { signAttemptToken, verifyAttemptToken } from '../utils/quizAttemptToken';

const IDENTITY_ORDER = [0, 1, 2, 3];

interface QuestionSeed {
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  active: boolean;
}

function questionPayload(index: number, overrides: Partial<QuestionSeed> = {}): QuestionSeed {
  return {
    questionText: `Question ${index}?`,
    options: [`A${index}`, `B${index}`, `C${index}`, `D${index}`],
    correctAnswer: 0,
    explanation: `Explanation ${index}`,
    active: true,
    ...overrides,
  };
}

async function createUser(role: 'user' | 'admin' = 'user', suffix: string | number = Date.now()): Promise<UserDocument> {
  const user = new User({
    username: `${role}${suffix}`,
    email: `${role}${suffix}@example.com`,
    role,
  });
  await user.setPassword('Password123');
  await user.save();
  return user;
}

async function login(username: string): Promise<string> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username, password: 'Password123' });

  return response.body.data.token;
}

async function seedQuestions(count = QUIZ_LENGTH): Promise<QuestionDocument[]> {
  return Question.insertMany(
    Array.from({ length: count }, (_, index) => questionPayload(index + 1))
  );
}

function correctAnswer(question: Pick<QuestionSeed, 'correctAnswer'>): number {
  return question.correctAnswer;
}

function wrongAnswer(question: Pick<QuestionSeed, 'correctAnswer'>): number {
  return (correctAnswer(question) + 1) % OPTIONS_PER_QUESTION;
}

async function createCompletedAttempt(user: UserDocument, score = QUIZ_LENGTH) {
  // Reuse the seeded bank if it already exists so repeated attempts in one test don't
  // collide on the unique questionText index.
  const existing = await Question.find().sort({ _id: 1 });
  const questions = existing.length >= QUIZ_LENGTH ? existing : await seedQuestions();
  const answers = questions.map((question, index) => ({
    questionId: question._id,
    selectedAnswer:
      index < score ? correctAnswer(question) : wrongAnswer(question),
    isCorrect: index < score,
    optionOrder: IDENTITY_ORDER,
  }));

  return Score.create({
    userId: user._id,
    attemptId: crypto.randomUUID(),
    score,
    answers,
  });
}

beforeAll(async () => {
  await mongoose.connect(TEST_MONGODB_URI);
});

beforeEach(async () => {
  await Promise.all([
    Question.deleteMany({}),
    Score.deleteMany({}),
    User.deleteMany({}),
    Attempt.deleteMany({}),
  ]);
});

/** Public question shape returned to the browser by GET /quiz/start. */
interface StartedQuestion {
  _id: string;
  questionText: string;
  options: string[];
  topic: string;
}

// Drive the per-question lock flow: POST /quiz/answer for each question in order.
// `chooseIndex(question, order)` returns the displayed (shuffled) index to lock.
async function answerAll(
  token: string,
  attemptToken: string,
  startedQuestions: StartedQuestion[],
  orderByQid: Record<string, number[]>,
  chooseIndex: (question: StartedQuestion, order: number[]) => number
) {
  for (const question of startedQuestions) {
    const qid = question._id.toString();
    await request(app)
      .post('/api/quiz/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken, questionId: qid, selectedAnswer: chooseIndex(question, orderByQid[qid]) })
      .expect(200);
  }
}

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('backend service metadata', () => {
  test('describes the API at the root route', async () => {
    const response = await request(app).get('/').expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        message: API_TITLE,
        docs: '/api-docs',
        health: '/api/health',
      },
    });
  });
});

describe('auth and access control API', () => {
  test('registers users as players even when role is submitted', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'player-one',
        email: 'player-one@example.com',
        password: 'Password123',
        role: 'admin',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: { user: { username: 'player-one', role: 'user' } },
    });
  });

  test('protects current-user and admin endpoints', async () => {
    const player = await createUser('user', 'protected');
    const admin = await createUser('admin', 'protected');
    const playerToken = await login(player.username);
    const adminToken = await login(admin.username);

    await request(app).get('/api/auth/me').expect(401);

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${playerToken}`)
      .expect(200);
    expect(meResponse.body.data.user.role).toBe('user');

    await request(app)
      .get('/api/admin/questions')
      .set('Authorization', `Bearer ${playerToken}`)
      .expect(403);

    await request(app)
      .get('/api/admin/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  test('rejects invalid credentials', async () => {
    const user = await createUser('user', 'wrongpassword');

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: user.username, password: 'wrong' })
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: 'Invalid username or password',
    });
  });
});

describe('quiz API', () => {
  test('returns 403 when an admin tries to start a quiz', async () => {
    const admin = await createUser('admin', 'forbidquizstart');
    const token = await login(admin.username);

    const response = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: 'Admins cannot take quizzes.',
    });
  });

  test('requires authentication and at least ten active questions to start', async () => {
    const user = await createUser('user', 'shortquiz');
    const token = await login(user.username);
    await seedQuestions(QUIZ_LENGTH - 1);

    await request(app).get('/api/quiz/start').expect(401);

    const response = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: 'Not enough active questions in database (need at least 10)',
    });
  });

  test('starts a ten-question quiz without exposing correct answers', async () => {
    const user = await createUser('user', 'startquiz');
    const token = await login(user.username);
    const seeded = await seedQuestions();
    const optionsById = Object.fromEntries(
      seeded.map((question): [string, string[]] => [question._id.toString(), question.options])
    );

    const response = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.attemptToken).toEqual(expect.any(String));
    expect(response.body.data.attemptToken.length).toBeGreaterThan(0);
    expect(response.body.data.questions).toHaveLength(QUIZ_LENGTH);
    expect(response.body.data.questions[0]).toMatchObject({
      questionText: expect.any(String),
      options: expect.any(Array),
    });

    const decodedAttempt = verifyAttemptToken(response.body.data.attemptToken, user._id);
    const orderById = Object.fromEntries(
      decodedAttempt.items.map((item): [string, number[]] => [item.qid, item.order])
    );

    for (const question of response.body.data.questions) {
      const sourceOptions = optionsById[question._id];
      const order = orderById[question._id];
      expect(question.options).toHaveLength(OPTIONS_PER_QUESTION);
      expect(isValidPermutation(order)).toBe(true);
      expect(question.options).toEqual(order.map(index => sourceOptions[index]));
      expect(question).not.toHaveProperty('correctAnswer');
      expect(question).not.toHaveProperty('explanation');
    }
  });

  test('scores displayed answer indexes against the original question-bank correct answer', async () => {
    const user = await createUser('user', 'shuffledmapping');
    const token = await login(user.username);
    const source = await Question.insertMany(
      Array.from({ length: QUIZ_LENGTH }, (_, index) =>
        questionPayload(index + 1, {
          options: [`A${index}`, `B${index}`, `C${index}`, `D${index}`],
          correctAnswer: index % OPTIONS_PER_QUESTION,
        })
      )
    );
    const correctById = Object.fromEntries(
      source.map((q): [string, number] => [q._id.toString(), q.correctAnswer])
    );

    const startResponse = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const { attemptToken, questions: started } = startResponse.body.data;
    const decoded = verifyAttemptToken(attemptToken, user._id);
    const orderByQid = Object.fromEntries(
      decoded.items.map((item): [string, number[]] => [item.qid, item.order])
    );

    // Lock the displayed index that maps back to each question's stored correct answer.
    await answerAll(token, attemptToken, started, orderByQid, (question, order) =>
      order.indexOf(correctById[question._id])
    );

    const response = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken })
      .expect(200);

    expect(response.body.data.score).toBe(QUIZ_LENGTH);
    for (const reviewRow of response.body.data.review) {
      const displayedCorrectIndex = orderByQid[reviewRow.questionId].indexOf(
        correctById[reviewRow.questionId]
      );
      expect(reviewRow.correctAnswer).toBe(displayedCorrectIndex);
      expect(reviewRow.selectedAnswer).toBe(displayedCorrectIndex);
      expect(reviewRow.isCorrect).toBe(true);
    }
  });

  test('submits a quiz, saves history, and returns review data', async () => {
    const user = await createUser('user', 'submitquiz');
    const token = await login(user.username);
    const questions = await seedQuestions();
    const correctTextById: Record<string, string> = {};
    for (const question of questions) {
      correctTextById[question._id.toString()] = question.options[question.correctAnswer];
    }

    const startResponse = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const { attemptToken, questions: started } = startResponse.body.data;

    // Lock each answer server-side in order (per-question lock), then finalise.
    for (const question of started) {
      const selectedAnswer = question.options.indexOf(correctTextById[question._id.toString()]);
      expect(selectedAnswer).toBeGreaterThanOrEqual(0);
      await request(app)
        .post('/api/quiz/answer')
        .set('Authorization', `Bearer ${token}`)
        .send({ attemptToken, questionId: question._id.toString(), selectedAnswer })
        .expect(200);
    }

    const submitResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken })
      .expect(200);

    expect(submitResponse.body).toMatchObject({
      success: true,
      data: {
        score: QUIZ_LENGTH,
        total: QUIZ_LENGTH,
        scoreId: expect.any(String),
        review: expect.any(Array),
      },
    });
    expect(submitResponse.body.data.review[0]).toMatchObject({
      questionText: expect.any(String),
      correctAnswer: expect.any(Number),
      isCorrect: true,
    });

    const historyResponse = await request(app)
      .get('/api/quiz/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(historyResponse.body.data).toHaveLength(1);
    expect(historyResponse.body.data[0]).toMatchObject({ score: QUIZ_LENGTH });

    const reviewResponse = await request(app)
      .get(`/api/quiz/history/${submitResponse.body.data.scoreId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(reviewResponse.body.data.review).toHaveLength(QUIZ_LENGTH);

    const persisted = await Score.findById(submitResponse.body.data.scoreId).lean();
    expect(persisted!.attemptId).toEqual(expect.any(String));
    expect(isValidPermutation(persisted!.answers[0].optionOrder)).toBe(true);
  });

  test('locks each answer server-side and rejects changing a locked answer', async () => {
    const user = await createUser('user', 'perqlock');
    const token = await login(user.username);
    await seedQuestions();
    const startResponse = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const { attemptToken, questions: started } = startResponse.body.data;
    const firstQid = started[0]._id.toString();

    // Invalid index is rejected at the per-question endpoint.
    const badIndex = await request(app)
      .post('/api/quiz/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken, questionId: firstQid, selectedAnswer: 4 })
      .expect(400);
    expect(badIndex.body.error).toBe('selectedAnswer must be an integer 0-3');

    // Lock the first answer, and confirm the DB now holds it.
    const locked = await request(app)
      .post('/api/quiz/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken, questionId: firstQid, selectedAnswer: 1 })
      .expect(200);
    expect(locked.body.data).toMatchObject({ locked: true, answered: 1, total: QUIZ_LENGTH });

    const decoded = verifyAttemptToken(attemptToken, user._id);
    const stored = await Attempt.findOne({ attemptId: decoded.attemptId }).lean();
    expect(stored!.items[0].selectedAnswer).toBe(1);

    // Re-answering the same (already locked) question is refused.
    const relock = await request(app)
      .post('/api/quiz/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken, questionId: firstQid, selectedAnswer: 2 })
      .expect(409);
    expect(relock.body.error).toBe('Question already answered');
    const unchanged = await Attempt.findOne({ attemptId: decoded.attemptId }).lean();
    expect(unchanged!.items[0].selectedAnswer).toBe(1);
  });

  test('enforces sequential answering and rejects questions outside the attempt', async () => {
    const user = await createUser('user', 'seqlock');
    const token = await login(user.username);
    const seeded = await seedQuestions(QUIZ_LENGTH + 1);
    const startResponse = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const { attemptToken, questions: started } = startResponse.body.data;

    // Answering the second question before the first is rejected.
    const outOfOrder = await request(app)
      .post('/api/quiz/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken, questionId: started[1]._id.toString(), selectedAnswer: 0 })
      .expect(409);
    expect(outOfOrder.body.error).toBe('Questions must be answered in order');

    // A question that is not part of this attempt is rejected.
    const startIds = new Set(started.map((q: StartedQuestion) => q._id.toString()));
    const extra = seeded.find(q => !startIds.has(q._id.toString()));
    const notInAttempt = await request(app)
      .post('/api/quiz/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken, questionId: extra!._id.toString(), selectedAnswer: 0 })
      .expect(400);
    expect(notInAttempt.body.error).toBe('Question is not part of this attempt');
  });

  test('refuses to finalise an attempt before every question is answered', async () => {
    const user = await createUser('user', 'incomplete');
    const token = await login(user.username);
    await seedQuestions();
    const startResponse = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const { attemptToken, questions: started } = startResponse.body.data;

    // Answer only the first question, then try to submit.
    await request(app)
      .post('/api/quiz/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken, questionId: started[0]._id.toString(), selectedAnswer: 0 })
      .expect(200);

    const response = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken })
      .expect(400);
    expect(response.body.error).toMatch(/All questions must be answered/);
  });

  test('rejects missing, tampered, replayed, and wrong-user attempt tokens', async () => {
    const owner = await createUser('user', 'tokenowner');
    const other = await createUser('user', 'tokenother');
    const ownerToken = await login(owner.username);
    const otherToken = await login(other.username);
    await seedQuestions();

    const startResponse = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const { attemptToken, questions: started } = startResponse.body.data;

    const missingResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({})
      .expect(400);
    expect(missingResponse.body.error).toBe('Missing attemptToken');

    const tamperedResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ attemptToken: attemptToken.replace(/\.[^.]+$/, '.invalidsignature') })
      .expect(401);
    expect(tamperedResponse.body.error).toBe('Invalid attempt token');

    const wrongUserResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ attemptToken })
      .expect(401);
    expect(wrongUserResponse.body.error).toBe('Attempt token does not belong to current user');

    // Lock every answer, submit once, then confirm replay is refused.
    for (const question of started) {
      await request(app)
        .post('/api/quiz/answer')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ attemptToken, questionId: question._id.toString(), selectedAnswer: 0 })
        .expect(200);
    }

    await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ attemptToken })
      .expect(200);

    const replayResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ attemptToken })
      .expect(409);
    expect(replayResponse.body.error).toBe('Attempt already submitted');
  });

  test('returns best-score leaderboard rows for authenticated callers', async () => {
    const player = await createUser('user', 'leaderboardplayer');
    const token = await login(player.username);
    await createCompletedAttempt(player, 8);
    await createCompletedAttempt(player, 10);

    const response = await request(app)
      .get('/api/quiz/leaderboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: [
        {
          username: player.username,
          bestScore: 10,
        },
      ],
    });
    expect(response.body.data[0]).toHaveProperty('bestAchievedAt');
  });

  test('returns at most 50 leaderboard rows', async () => {
    const questions = await seedQuestions();
    const answers = questions.map((question, index) => ({
      questionId: question._id,
      selectedAnswer:
        index < 5 ? correctAnswer(question) : wrongAnswer(question),
      isCorrect: index < 5,
      optionOrder: IDENTITY_ORDER,
    }));

    const players = await Promise.all(
      Array.from({ length: 55 }, (_, i) => createUser('user', `lblimit${i}`))
    );

    await Score.insertMany(
      players.map((player, i) => ({
        userId: player._id,
        attemptId: crypto.randomUUID(),
        score: i,
        answers,
        createdAt: new Date(Date.UTC(2024, 0, 1, 0, 0, i)),
      }))
    );

    const token = await login(players[0].username);
    const response = await request(app)
      .get('/api/quiz/leaderboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(50);
    expect(response.body.data[0].bestScore).toBe(54);
    expect(response.body.data[49].bestScore).toBe(5);
    expect(response.body.data.some((row: { bestScore: number }) => row.bestScore === 4)).toBe(false);
  });

  test('ranks tied best scores by earliest attempt that reached that score', async () => {
    const early = await createUser('user', 'lbearly');
    const late = await createUser('user', 'lblate');
    const token = await login(early.username);

    const questions = await seedQuestions();
    const answers = questions.map((question, index) => ({
      questionId: question._id,
      selectedAnswer:
        index < 8 ? correctAnswer(question) : wrongAnswer(question),
      isCorrect: index < 8,
      optionOrder: IDENTITY_ORDER,
    }));

    await Score.create({
      userId: early._id,
      attemptId: crypto.randomUUID(),
      score: 8,
      answers,
      createdAt: new Date('2024-06-01T10:00:00.000Z'),
    });
    await Score.create({
      userId: late._id,
      attemptId: crypto.randomUUID(),
      score: 8,
      answers,
      createdAt: new Date('2024-06-02T10:00:00.000Z'),
    });

    const response = await request(app)
      .get('/api/quiz/leaderboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.map((row: { username: string }) => row.username)).toEqual([early.username, late.username]);
    expect(response.body.data[0].bestScore).toBe(8);
    expect(new Date(response.body.data[0].bestAchievedAt).getTime()).toBeLessThan(
      new Date(response.body.data[1].bestAchievedAt).getTime()
    );
  });
});

describe('quiz option order utilities', () => {
  test('generates deterministic output with an injected RNG and applies option order', () => {
    const rngValues = [0.1, 0.9, 0.3];
    const order = generateOptionOrder(() => rngValues.shift()!);

    expect(order).toEqual([1, 3, 2, 0]);
    expect(isValidPermutation(order)).toBe(true);

    const question = questionPayload(1, {
      options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
      correctAnswer: 3,
    });

    expect(applyOptionOrder(question, [2, 0, 3, 1])).toMatchObject({
      options: ['Gamma', 'Alpha', 'Delta', 'Beta'],
      correctAnswer: 2,
    });
  });
});

describe('quiz authorization boundaries', () => {
  test('does not let another user read an attempt detail (IDOR)', async () => {
    const owner = await createUser('user', 'idorowner');
    const attacker = await createUser('user', 'idorattacker');
    const attackerToken = await login(attacker.username);
    const attempt = await createCompletedAttempt(owner, 7);

    await request(app)
      .get(`/api/quiz/history/${attempt._id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .expect(404);
  });

  test("history only returns the caller's own attempts", async () => {
    const owner = await createUser('user', 'histowner');
    const other = await createUser('user', 'histother');
    await createCompletedAttempt(owner, 5);
    const otherToken = await login(other.username);

    const response = await request(app)
      .get('/api/quiz/history')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);

    expect(response.body.data).toEqual([]);
  });

  test('rejects a quiz-attempt token used as a session bearer token', async () => {
    const user = await createUser('user', 'purposeconfusion');
    const questions = await seedQuestions();
    const { token } = signAttemptToken({
      userId: user._id.toString(),
      questions: questions.map((q) => ({ _id: q._id, optionOrder: IDENTITY_ORDER })),
    });

    await request(app)
      .get('/api/quiz/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  test('rejects requests with no Authorization header', async () => {
    await request(app).get('/api/quiz/history').expect(401);
  });

  test('rejects an expired attempt token on submit', async () => {
    const user = await createUser('user', 'expiredattempt');
    const token = await login(user.username);
    const questions = await seedQuestions();

    const expiredAttempt = jwt.sign(
      {
        purpose: 'quiz_attempt',
        userId: user._id.toString(),
        attemptId: crypto.randomUUID(),
        items: questions.map((q) => ({ qid: q._id.toString(), order: IDENTITY_ORDER })),
      },
      getJwtSecret(),
      { algorithm: JWT_ALGORITHM, expiresIn: -10 }
    );

    const response = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        attemptToken: expiredAttempt,
        answers: questions.map((q) => ({ questionId: q._id, selectedAnswer: 0 })),
      })
      .expect(401);

    expect(response.body.error).toMatch(/expired/i);
  });
});
