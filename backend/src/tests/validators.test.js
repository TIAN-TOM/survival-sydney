// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// validation regression coverage for currently wired request schemas.
const { loginSchema, registerSchema } = require('../validators/auth.validators');

describe('auth validators', () => {
  test('public registration cannot assign an admin role', () => {
    const parsed = registerSchema.parse({
      username: 'student1',
      email: 'STUDENT1@example.com',
      password: 'Password123',
      role: 'admin',
    });

    expect(parsed).toEqual({
      username: 'student1',
      email: 'student1@example.com',
      password: 'Password123',
    });
  });

  test('login requires non-empty credentials', () => {
    expect(loginSchema.safeParse({ username: 'student1', password: 'Password123' }).success)
      .toBe(true);
    expect(loginSchema.safeParse({ username: '', password: 'Password123' }).success)
      .toBe(false);
    expect(loginSchema.safeParse({ username: 'student1', password: '' }).success)
      .toBe(false);
  });
});
