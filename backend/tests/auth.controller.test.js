const request = require('supertest');
const { startTestDb, stopTestDb, clearTestDb } = require('./setup');

let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await startTestDb();
  app = require('../server');
});

afterEach(clearTestDb);
afterAll(stopTestDb);

describe('POST /api/auth/register', () => {
  test('returns token and user on success', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.username).toBe('alice');
    expect(res.body.data.user.role).toBe('user');
  });
});
