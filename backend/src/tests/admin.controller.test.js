const mongoose = require('mongoose');
const request = require('supertest');

process.env.JWT_SECRET = 'test-only-jwt-secret-value-at-least-32-chars';
process.env.JWT_EXPIRES_IN = '2h';
process.env.BCRYPT_ROUNDS = '4';
process.env.MONGODB_URI = 'mongodb://localhost:27017/comp5347_admin_test';

const app = require('../app');
const Question = require('../models/Question');
const User = require('../models/User');

async function createUser(role = 'admin', suffix = Date.now()) {
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
    .send({
      username,
      password: 'Password123',
    });

  return response.body.data.token;
}

function validQuestionPayload(overrides = {}) {
  return {
    questionText: 'What is React?',
    options: ['Library', 'Database', 'Operating System', 'Browser'],
    correctAnswer: 0,
    active: true,
    explanation: 'React is a JavaScript library for building user interfaces.',
    ...overrides,
  };
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

beforeEach(async () => {
  await Promise.all([
    Question.deleteMany({}),
    User.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Admin question API', () => {
  test('creates a question with valid admin token', async () => {
    const admin = await createUser('admin', 'create');
    const token = await login(admin.username);

    const response = await request(app)
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`)
      .send(validQuestionPayload())
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        questionText: 'What is React?',
        options: ['Library', 'Database', 'Operating System', 'Browser'],
        correctAnswer: 0,
        active: true,
        explanation: 'React is a JavaScript library for building user interfaces.',
      },
    });

    const savedQuestion = await Question.findOne({ questionText: 'What is React?' });
    expect(savedQuestion).not.toBeNull();
  });

  test('rejects duplicate question creation', async () => {
    const admin = await createUser('admin', 'createdupe');
    const token = await login(admin.username);
    await Question.create(validQuestionPayload({
      questionText: 'What is React?',
    }));

    const response = await request(app)
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`)
      .send(validQuestionPayload({
        questionText: '  what   is react?  ',
      }))
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/questionText already exists/i);

    const count = await Question.countDocuments();
    expect(count).toBe(1);
  });

  test('rejects updating a question to duplicate another questionText', async () => {
    const admin = await createUser('admin', 'updatedupe');
    const token = await login(admin.username);
    await Question.create(validQuestionPayload({
      questionText: 'Existing question?',
    }));
    const editableQuestion = await Question.create(validQuestionPayload({
      questionText: 'Editable question?',
      correctAnswer: 1,
    }));

    const response = await request(app)
      .put(`/api/admin/questions/${editableQuestion._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(validQuestionPayload({
        questionText: ' existing   question? ',
      }))
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/questionText already exists/i);

    const unchangedQuestion = await Question.findById(editableQuestion._id);
    expect(unchangedQuestion.questionText).toBe('Editable question?');
  });

  test('rejects question creation for non-admin user', async () => {
    const player = await createUser('user', 'forbidden');
    const token = await login(player.username);

    const response = await request(app)
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`)
      .send(validQuestionPayload())
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/admin access required/i);
  });

  test('bulk imports valid questions', async () => {
    const admin = await createUser('admin', 'bulkvalid');
    const token = await login(admin.username);

    const response = await request(app)
      .post('/api/admin/questions/bulk-import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        questions: [
          validQuestionPayload({
            questionText: 'Question 1?',
            correctAnswer: 1,
          }),
          validQuestionPayload({
            questionText: 'Question 2?',
            correctAnswer: 2,
            explanation: '',
          }),
        ],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        insertedCount: 2,
      },
    });

    const count = await Question.countDocuments();
    expect(count).toBe(2);
  });

  test('rejects duplicate questionText rows inside one bulk import', async () => {
    const admin = await createUser('admin', 'bulkdupebatch');
    const token = await login(admin.username);

    const response = await request(app)
      .post('/api/admin/questions/bulk-import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        questions: [
          validQuestionPayload({
            questionText: 'Which library builds React user interfaces?',
          }),
          validQuestionPayload({
            questionText: '  which   library builds react user interfaces? ',
          }),
        ],
      })
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/Question 2: duplicate questionText matches Question 1/i);

    const count = await Question.countDocuments();
    expect(count).toBe(0);
  });

  test('rejects bulk import when a questionText already exists', async () => {
    const admin = await createUser('admin', 'bulkdupedb');
    const token = await login(admin.username);
    await Question.create(validQuestionPayload({
      questionText: 'Which database stores documents?',
    }));

    const response = await request(app)
      .post('/api/admin/questions/bulk-import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        questions: [
          validQuestionPayload({
            questionText: '  which database stores documents?  ',
          }),
        ],
      })
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/Question 1: questionText already exists/i);

    const count = await Question.countDocuments();
    expect(count).toBe(1);
  });

  test('returns index error when bulk import contains invalid item', async () => {
    const admin = await createUser('admin', 'bulkinvalid');
    const token = await login(admin.username);

    const response = await request(app)
      .post('/api/admin/questions/bulk-import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        questions: [
          validQuestionPayload({
            questionText: 'Valid question?',
          }),
          validQuestionPayload({
            questionText: 'Invalid question?',
            correctAnswer: 4,
          }),
        ],
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/Question 2/i);
    expect(response.body.error).toMatch(/correctAnswer must be an integer from 0 to 3/i);
    expect(Object.keys(response.body).sort()).toEqual(['error', 'success']);

    const count = await Question.countDocuments();
    expect(count).toBe(0);
  });

  test('rejects low-quality question payloads before inserting', async () => {
    const admin = await createUser('admin', 'quality');
    const token = await login(admin.username);

    const response = await request(app)
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`)
      .send(validQuestionPayload({
        questionText: '????????',
        options: ['Library', 'Library', 'Operating System', 'Browser'],
      }))
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/questionText must include at least one letter or number/i);

    const count = await Question.countDocuments();
    expect(count).toBe(0);
  });

  test('returns all indexed bulk import validation errors', async () => {
    const admin = await createUser('admin', 'bulkallinvalid');
    const token = await login(admin.username);

    const response = await request(app)
      .post('/api/admin/questions/bulk-import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        questions: [
          validQuestionPayload({
            questionText: '!!!!!!!!!',
          }),
          validQuestionPayload({
            questionText: 'Duplicate options?',
            options: ['Same', 'Same', 'Different', 'Another'],
          }),
        ],
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/Bulk import validation failed/i);
    expect(response.body.error).toMatch(/Question 1: questionText must include/i);
    expect(response.body.error).toMatch(/Question 2: options must be unique/i);
    expect(Object.keys(response.body).sort()).toEqual(['error', 'success']);

    const count = await Question.countDocuments();
    expect(count).toBe(0);
  });

  test('toggles question active status', async () => {
    const admin = await createUser('admin', 'toggle');
    const token = await login(admin.username);

    const question = await Question.create(validQuestionPayload({ active: true }));

    const response = await request(app)
      .patch(`/api/admin/questions/${question._id}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.active).toBe(false);

    const updatedQuestion = await Question.findById(question._id);
    expect(updatedQuestion.active).toBe(false);
  });

  test('deletes a question and 404s on a missing id', async () => {
    const admin = await createUser('admin', 'delete');
    const token = await login(admin.username);
    const question = await Question.create(validQuestionPayload());

    await request(app)
      .delete(`/api/admin/questions/${question._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(await Question.findById(question._id)).toBeNull();

    await request(app)
      .delete(`/api/admin/questions/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  test('returns 400 for a malformed :id instead of a 500 CastError', async () => {
    const admin = await createUser('admin', 'badid');
    const token = await login(admin.username);

    await request(app)
      .put('/api/admin/questions/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`)
      .send(validQuestionPayload())
      .expect(400);

    await request(app)
      .delete('/api/admin/questions/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    await request(app)
      .patch('/api/admin/questions/not-a-valid-id/toggle')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  test('preserves active/explanation when a PUT omits them', async () => {
    const admin = await createUser('admin', 'partialupdate');
    const token = await login(admin.username);
    const question = await Question.create(
      validQuestionPayload({ active: false, explanation: 'Keep me' })
    );

    const response = await request(app)
      .put(`/api/admin/questions/${question._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionText: 'Updated question text here',
        options: ['One', 'Two', 'Three', 'Four'],
        correctAnswer: 1,
      })
      .expect(200);

    expect(response.body.data.active).toBe(false);
    expect(response.body.data.explanation).toBe('Keep me');
  });
});
