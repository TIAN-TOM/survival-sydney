// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// validation regression coverage across auth, admin, and quiz contracts.
const { registerSchema } = require('../validators/auth.validators');
const { questionSchema } = require('../validators/admin.validators');
const { QUIZ_LENGTH, submitQuizSchema } = require('../validators/quiz.validators');

describe('assignment validators', () => {
  test('public registration cannot assign an admin role', () => {
    const parsed = registerSchema.parse({
      username: 'student1',
      email: 'student1@example.com',
      password: 'Password123',
      role: 'admin',
    });

    expect(parsed).toEqual({
      username: 'student1',
      email: 'student1@example.com',
      password: 'Password123',
    });
  });

  test('question correct answer must be one of exactly four options', () => {
    const invalid = questionSchema.safeParse({
      text: 'Which answer is valid?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'E',
      explanation: '',
      active: true,
    });

    expect(invalid.success).toBe(false);
  });

  test('quiz submission requires exactly ten unique answers', () => {
    const sessionId = '11111111-1111-4111-8111-111111111111';
    const answers = Array.from({ length: QUIZ_LENGTH }, (_, index) => ({
      questionId: `507f1f77bcf86cd7994390${String(index).padStart(2, '0')}`,
      selectedAnswer: 'A',
    }));

    expect(submitQuizSchema.safeParse({ sessionId, answers }).success).toBe(true);
    expect(submitQuizSchema.safeParse({ sessionId, answers: answers.slice(0, 9) }).success).toBe(false);
    expect(
      submitQuizSchema.safeParse({
        sessionId,
        answers: answers.map((answer, index) => (index === 9 ? answers[0] : answer)),
      }).success
    ).toBe(false);
  });
});
