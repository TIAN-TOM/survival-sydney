const { getJwtSecret } = require('../config/auth');

describe('getJwtSecret', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('rejects the shipped placeholder secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'your_jwt_secret_here';
    expect(() => getJwtSecret()).toThrow(/weak or a known placeholder/i);
  });

  test('rejects a secret shorter than 32 characters', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'too-short-secret';
    expect(() => getJwtSecret()).toThrow(/at least 32/i);
  });

  test('accepts a strong secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'x'.repeat(40);
    expect(getJwtSecret()).toHaveLength(40);
  });

  test('throws when JWT_SECRET is missing outside test mode', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(/required/i);
  });
});
