// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// end-to-end backend API coverage aligned with the current dev API surface.
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
const { shuffleQuestion } = require('../utils/shuffleQuestion');

const QUIZ_LENGTH = 10;

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

function shuffledCorrectAnswer(question) {
  return shuffleQuestion(question.toObject()).correctAnswer;
}

function shuffledWrongAnswer(question) {
  return (shuffledCorrectAnswer(question) + 1) % 4;
}

function answerPayload(question, isCorrect = true) {
  return {
    questionId: question._id.toString(),
    selectedAnswer: isCorrect ? shuffledCorrectAnswer(question) : shuffledWrongAnswer(question),
  };
}

async function createCompletedAttempt(user, score = QUIZ_LENGTH) {
  const questions = await seedQuestions();
  const answers = questions.map((question, index) => ({
    questionId: question._id,
    selectedAnswer:
      index < score ? shuffledCorrectAnswer(question) : shuffledWrongAnswer(question),
    isCorrect: index < score,
  }));

  return Score.create({
    userId: user._id,
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
    await seedQuestions();

    const response = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(QUIZ_LENGTH);
    expect(response.body.data[0]).toMatchObject({
      questionText: expect.any(String),
      options: expect.any(Array),
    });
    expect(response.body.data[0]).not.toHaveProperty('correctAnswer');
    expect(response.body.data[0]).not.toHaveProperty('explanation');
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
    const answers = startResponse.body.data.map((question) => ({
      questionId: question._id.toString(),
      selectedAnswer: question.options.indexOf(correctTextById[question._id.toString()]),
    }));
    expect(answers.every((answer) => answer.selectedAnswer >= 0)).toBe(true);

    const submitResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ answers })
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
  });

  test('rejects malformed submissions', async () => {
    const user = await createUser('user', 'badsubmit');
    const token = await login(user.username);
    const questions = await seedQuestions();
    const answers = questions.map((question) => answerPayload(question));

    const duplicateResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ answers: answers.map((answer, index) => (index === 9 ? answers[0] : answer)) })
      .expect(400);
    expect(duplicateResponse.body.error).toBe('Duplicate question IDs detected');

    const invalidAnswerResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: answers.map((answer, index) =>
          index === 0 ? { ...answer, selectedAnswer: 4 } : answer
        ),
      })
      .expect(400);
    expect(invalidAnswerResponse.body.error).toBe('selectedAnswer must be an integer 0-3');
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
  });
});
