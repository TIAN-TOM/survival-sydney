// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// end-to-end backend API coverage across auth, quiz, admin, and review flows.
const mongoose = require('mongoose');
const request = require('supertest');

process.env.JWT_SECRET = 'test-only-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/comp5347_quiz_test';

const app = require('../app');
const Question = require('../models/Question');
const Score = require('../models/Score');
const User = require('../models/User');
const { clearQuizSessions } = require('../services/quizSessionStore');
const { QUIZ_LENGTH } = require('../validators/quiz.validators');

function questionPayload(index, overrides = {}) {
  return {
    text: `Question ${index}?`,
    options: [`A${index}`, `B${index}`, `C${index}`, `D${index}`],
    correctAnswer: `A${index}`,
    topic: `Topic ${index}`,
    difficulty: 'application',
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

async function seedBalancedQuestionBank() {
  const difficulties = ['foundation', 'application', 'analysis'];

  return Question.insertMany(
    Array.from({ length: 30 }, (_, index) =>
      questionPayload(`balanced-${index + 1}`, {
        topic: `Topic ${index % 10}`,
        difficulty: difficulties[index % difficulties.length],
      })
    )
  );
}

async function createCompletedAttempt(user, score = QUIZ_LENGTH) {
  const questions = await seedQuestions();
  const answers = questions.map((question, index) => {
    const isCorrect = index < score;

    return {
      questionId: question._id,
      selectedAnswer: isCorrect ? question.correctAnswer : question.options[1],
      isCorrect,
      questionSnapshot: {
        text: question.text,
        options: question.options,
        correctAnswer: question.correctAnswer,
        topic: question.topic,
        difficulty: question.difficulty,
        explanation: question.explanation,
      },
    };
  });

  return Score.create({
    user: user._id,
    score,
    totalQuestions: QUIZ_LENGTH,
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
  clearQuizSessions();
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

  test('requires at least ten active questions to start', async () => {
    const user = await createUser('user', 'shortquiz');
    const token = await login(user.username);
    await seedQuestions(QUIZ_LENGTH - 1);

    const response = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      details: { activeQuestions: QUIZ_LENGTH - 1, requiredQuestions: QUIZ_LENGTH },
    });
  });

  test('protects leaderboard behind player authentication', async () => {
    const user = await createUser('user', 'leaderboardauth');
    const token = await login(user.username);

    await request(app).get('/api/quiz/leaderboard').expect(401);

    const response = await request(app)
      .get('/api/quiz/leaderboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: { leaderboard: [] },
    });
  });

  test('excludes admin scores from leaderboard for every viewer', async () => {
    const player = await createUser('user', 'leaderboardplayer');
    const admin = await createUser('admin', 'leaderboardadmin');
    const playerToken = await login(player.username);
    const adminToken = await login(admin.username);

    await createCompletedAttempt(player, 9);
    await createCompletedAttempt(admin, 10);

    const playerResponse = await request(app)
      .get('/api/quiz/leaderboard')
      .set('Authorization', `Bearer ${playerToken}`)
      .expect(200);
    expect(playerResponse.body.data.leaderboard.map((entry) => entry.username)).toEqual([
      player.username,
    ]);

    const adminResponse = await request(app)
      .get('/api/quiz/leaderboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminResponse.body.data.leaderboard.map((entry) => entry.username)).toEqual([
      player.username,
    ]);
  });

  test('applies leaderboard limit after excluding admin scores', async () => {
    const player = await createUser('user', 'limitedleaderboardplayer');
    const admin = await createUser('admin', 'limitedleaderboardadmin');
    const playerToken = await login(player.username);

    await createCompletedAttempt(admin, 10);
    await createCompletedAttempt(player, 9);

    const response = await request(app)
      .get('/api/quiz/leaderboard?limit=1')
      .set('Authorization', `Bearer ${playerToken}`)
      .expect(200);

    expect(response.body.data.leaderboard).toHaveLength(1);
    expect(response.body.data.leaderboard[0]).toMatchObject({
      rank: 1,
      username: player.username,
      score: 9,
      totalQuestions: QUIZ_LENGTH,
    });
  });

  test('allows admins to clear player leaderboard entries', async () => {
    const player = await createUser('user', 'clearleaderboardplayer');
    const admin = await createUser('admin', 'clearleaderboardadmin');
    const playerToken = await login(player.username);
    const adminToken = await login(admin.username);

    await createCompletedAttempt(player, 9);
    await createCompletedAttempt(admin, 10);

    await request(app)
      .delete('/api/admin/leaderboard')
      .set('Authorization', `Bearer ${playerToken}`)
      .expect(403);

    const clearResponse = await request(app)
      .delete('/api/admin/leaderboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(clearResponse.body.data.deletedCount).toBe(1);

    const leaderboardResponse = await request(app)
      .get('/api/quiz/leaderboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(leaderboardResponse.body.data.leaderboard).toEqual([]);
    await expect(Score.countDocuments({ user: admin._id })).resolves.toBe(1);
  });

  test('samples a balanced quiz from a larger metadata-rich question bank', async () => {
    const user = await createUser('user', 'balanced');
    const token = await login(user.username);
    await seedBalancedQuestionBank();

    const response = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const { questions } = response.body.data;
    const difficultyCounts = questions.reduce(
      (counts, question) => ({
        ...counts,
        [question.difficulty]: (counts[question.difficulty] || 0) + 1,
      }),
      {}
    );
    const topicCounts = questions.reduce(
      (counts, question) => ({
        ...counts,
        [question.topic]: (counts[question.topic] || 0) + 1,
      }),
      {}
    );

    expect(questions).toHaveLength(QUIZ_LENGTH);
    expect(difficultyCounts).toEqual({ foundation: 3, application: 4, analysis: 3 });
    expect(Math.max(...Object.values(topicCounts))).toBeLessThanOrEqual(2);
    expect(new Set(questions.map((question) => question.topic)).size).toBeGreaterThanOrEqual(5);
  });

  test('uses a session snapshot for submit and review even after a question is deleted', async () => {
    const user = await createUser('user', 'snapshot');
    const token = await login(user.username);
    await seedQuestions();

    const startResponse = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const { questions, sessionId } = startResponse.body.data;

    expect(questions).toHaveLength(QUIZ_LENGTH);
    expect(questions[0]).not.toHaveProperty('correctAnswer');

    await Question.findByIdAndDelete(questions[0].id);

    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedAnswer: question.options[0],
    }));
    const submitResponse = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId, answers })
      .expect(201);

    expect(submitResponse.body.data.attempt.answers).toHaveLength(QUIZ_LENGTH);

    const reviewResponse = await request(app)
      .get(`/api/quiz/review/${submitResponse.body.data.attemptId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const deletedQuestionAnswer = reviewResponse.body.data.attempt.answers.find(
      (answer) => answer.question?.text === questions[0].text
    );

    expect(deletedQuestionAnswer).toBeDefined();
    expect(deletedQuestionAnswer.question.text).toBe(questions[0].text);
    expect(deletedQuestionAnswer.question.options).toEqual(questions[0].options);

    await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId, answers })
      .expect(409);
  });

  test('rejects answers that are not one of the served options', async () => {
    const user = await createUser('user', 'badanswer');
    const token = await login(user.username);
    await seedQuestions();

    const startResponse = await request(app)
      .get('/api/quiz/start')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const { questions, sessionId } = startResponse.body.data;

    const response = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionId,
        answers: questions.map((question, index) => ({
          questionId: question.id,
          selectedAnswer: index === 0 ? 'not-a-served-option' : question.options[0],
        })),
      })
      .expect(400);

    expect(response.body.error).toBe('Submitted answer must match one of the question options');
  });
});

describe('admin API', () => {
  test('creates, updates, toggles, and deletes questions with admin access', async () => {
    const admin = await createUser('admin', 'crud');
    const token = await login(admin.username);

    const createResponse = await request(app)
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`)
      .send(questionPayload('crud'))
      .expect(201);
    const questionId = createResponse.body.data.question.id;
    expect(createResponse.body.data.question).toMatchObject({
      topic: 'Topic crud',
      difficulty: 'application',
    });

    const updateResponse = await request(app)
      .patch(`/api/admin/questions/${questionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Updated Topic', difficulty: 'analysis', explanation: 'Updated explanation' })
      .expect(200);
    expect(updateResponse.body.data.question).toMatchObject({
      topic: 'Updated Topic',
      difficulty: 'analysis',
      explanation: 'Updated explanation',
    });

    const toggleResponse = await request(app)
      .patch(`/api/admin/questions/${questionId}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false })
      .expect(200);
    expect(toggleResponse.body.data.question.active).toBe(false);

    await request(app)
      .patch(`/api/admin/questions/${questionId}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: 'false' })
      .expect(400);

    await request(app)
      .delete(`/api/admin/questions/${questionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  test('reports invalid bulk import item indexes', async () => {
    const admin = await createUser('admin', 'bulk');
    const token = await login(admin.username);
    const questions = Array.from({ length: 6 }, (_, index) => questionPayload(index + 1));
    questions[5] = { ...questions[5], correctAnswer: 'not-an-option' };

    const response = await request(app)
      .post('/api/admin/bulk-import')
      .set('Authorization', `Bearer ${token}`)
      .send(questions)
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: 'Bulk import validation failed',
    });
    expect(response.body.details.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ index: 5, path: 'correctAnswer' }),
      ])
    );
  });
});
