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

  test('returns 409 when username is already taken', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'secret123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'another123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/already taken/i);
  });
});

describe('POST /api/auth/login', () => {
  test('returns token on valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob', password: 'secret123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'bob', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.username).toBe('bob');
  });

  test('returns 401 on wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob', password: 'secret123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'bob', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });
});
