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
  test('returns user without token on success', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeUndefined();
    expect(res.body.data.user.username).toBe('alice');
    expect(res.body.data.user.role).toBe('user');
  });

  test('returns 409 when username is already taken', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'secret123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice2@example.com', password: 'another123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/already taken/i);
  });
});

describe('POST /api/auth/login', () => {
  test('returns token on valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob', email: 'bob@example.com', password: 'secret123' });

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
      .send({ username: 'bob', email: 'bob2@example.com', password: 'secret123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'bob', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid username or password/i);
  });
});

describe('GET /api/auth/me', () => {
  test('returns user when token is valid', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'carol', email: 'carol@example.com', password: 'secret123' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'carol', password: 'secret123' });
    const token = loginRes.body.data.token;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe('carol');
  });

  test('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
