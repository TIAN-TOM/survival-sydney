// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// end-to-end backend API coverage aligned with the current dev API surface.
const crypto = require('crypto');
const mongoose = require('mongoose');
const request = require('supertest');

process.env.JWT_SECRET = 'test-only-jwt-secret';
process.env.JWT_EXPIRES_IN = '2h';
process.env.BCRYPT_ROUNDS = '4';
process.env.MONGODB_URI = 'mongodb://localhost:27017/comp5347_quiz_api_test';

const app = require('../app');
const Question = require('../models/Question');
const Score = require('../models/Score');
const User = require('../models/User');
const { QUIZ_LENGTH, OPTIONS_PER_QUESTION } = require('../config/quiz');
const {
  applyOptionOrder,
  generateOptionOrder,
  isValidPermutation,
} = require('../utils/shuffleQuestion');

const IDENTITY_ORDER = [0, 1, 2, 3];

function questionPayload(index, overrides = {}) {
  return {
    questionText: `Question ${index}?`,
    options: [`A${index}`, `B${index}`, `C${index}`, `D${index}`],
    correctAnswer: 0,
    explanation: `Explanation ${index}`,
    active: true,
    ...overrides,
  };
}

async function createUser(role = 'user', suffix = Date.now()) {
  const user = new User({
    username: `${role}${suffix}`,
    email: `${role}${suffix}@example.com`,
    role,
  });
  await user.setPassword('Password123');
  await user.save();
  return user;
}

async function login(username) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username, password: 'Password123' });

  return response.body.data.token;
}

async function seedQuestions(count = QUIZ_LENGTH) {
  return Question.insertMany(
    Array.from({ length: count }, (_, index) => questionPayload(index + 1))
  );
}

function correctAnswer(question) {
  return question.correctAnswer;
}

function wrongAnswer(question) {
  return (correctAnswer(question) + 1) % OPTIONS_PER_QUESTION;
}

async function createCompletedAttempt(user, score = QUIZ_LENGTH) {
  const questions = await seedQuestions();
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
  await mongoose.connect(process.env.MONGODB_URI);
});

beforeEach(async () => {
  await Promise.all([
    Question.deleteMany({}),
    Score.deleteMany({}),
    User.deleteMany({}),
  ]);
});

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
        message: 'COMP5347 Quiz API',
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
      seeded.map(question => [question._id.toString(), question.options])
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
    for (const question of response.body.data.questions) {
      expect(question.options).toHaveLength(OPTIONS_PER_QUESTION);
      expect([...question.options].sort()).toEqual([...optionsById[question._id]].sort());
      expect(question).not.toHaveProperty('correctAnswer');
      expect(question).not.toHaveProperty('explanation');
    }
  });

  test('submits a quiz, saves history, and returns review data', async () => {
    const user = await createUser('user', 'submitquiz');
    const token = await login(user.username);
    const questions = await seedQuestions();
    const correctTextById = {};
    for (const question of questions) {
      correctTextById[question._id.toString()] = question.options[question.correctAnswer];
    }

    const startResponse = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const answers = startResponse.body.data.questions.map((question) => ({
      questionId: question._id.toString(),
      selectedAnswer: question.options.indexOf(correctTextById[question._id.toString()]),
    }));
    expect(answers.every((answer) => answer.selectedAnswer >= 0)).toBe(true);

    const submitResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken: startResponse.body.data.attemptToken, answers })
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
    expect(persisted.attemptId).toEqual(expect.any(String));
    expect(isValidPermutation(persisted.answers[0].optionOrder)).toBe(true);
  });

  test('rejects malformed submissions', async () => {
    const user = await createUser('user', 'badsubmit');
    const token = await login(user.username);
    await seedQuestions();
    const startResponse = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const answers = startResponse.body.data.questions.map((question) => ({
      questionId: question._id.toString(),
      selectedAnswer: 0,
    }));

    const duplicateResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        attemptToken: startResponse.body.data.attemptToken,
        answers: answers.map((answer, index) => (index === 9 ? answers[0] : answer)),
      })
      .expect(400);
    expect(duplicateResponse.body.error).toBe('Duplicate question IDs detected');

    const invalidAnswerResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        attemptToken: startResponse.body.data.attemptToken,
        answers: answers.map((answer, index) =>
          index === 0 ? { ...answer, selectedAnswer: 4 } : answer
        ),
      })
      .expect(400);
    expect(invalidAnswerResponse.body.error).toBe('selectedAnswer must be an integer 0-3');
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
    const answers = startResponse.body.data.questions.map(question => ({
      questionId: question._id.toString(),
      selectedAnswer: 0,
    }));
    const attemptToken = startResponse.body.data.attemptToken;

    const missingResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ answers })
      .expect(400);
    expect(missingResponse.body.error).toBe('Missing attemptToken');

    const tamperedResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        attemptToken: attemptToken.replace(/\.[^.]+$/, '.invalidsignature'),
        answers,
      })
      .expect(401);
    expect(tamperedResponse.body.error).toBe('Invalid attempt token');

    const wrongUserResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ attemptToken, answers })
      .expect(401);
    expect(wrongUserResponse.body.error).toBe('Attempt token does not belong to current user');

    await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ attemptToken, answers })
      .expect(200);

    const replayResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ attemptToken, answers })
      .expect(409);
    expect(replayResponse.body.error).toBe('Attempt already submitted');
  });

  test('rejects submitted question IDs that do not match the attempt token', async () => {
    const user = await createUser('user', 'qidmismatch');
    const token = await login(user.username);
    const seeded = await seedQuestions(QUIZ_LENGTH + 1);

    const startResponse = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const startIds = new Set(startResponse.body.data.questions.map(question => question._id.toString()));
    const extraQuestion = seeded.find(question => !startIds.has(question._id.toString()));
    const answers = startResponse.body.data.questions.map(question => ({
      questionId: question._id.toString(),
      selectedAnswer: 0,
    }));
    answers[0] = {
      questionId: extraQuestion._id.toString(),
      selectedAnswer: 0,
    };

    const response = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ attemptToken: startResponse.body.data.attemptToken, answers })
      .expect(400);

    expect(response.body.error).toBe('Submitted question IDs do not match attempt token');
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
    expect(response.body.data.some((row) => row.bestScore === 4)).toBe(false);
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

    expect(response.body.data.map((row) => row.username)).toEqual([early.username, late.username]);
    expect(response.body.data[0].bestScore).toBe(8);
    expect(new Date(response.body.data[0].bestAchievedAt).getTime()).toBeLessThan(
      new Date(response.body.data[1].bestAchievedAt).getTime()
    );
  });
});

describe('quiz option order utilities', () => {
  test('generates deterministic output with an injected RNG and applies option order', () => {
    const rngValues = [0.1, 0.9, 0.3];
    const order = generateOptionOrder(() => rngValues.shift());

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
