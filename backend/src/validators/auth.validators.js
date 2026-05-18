const { z } = require('zod');
const { fail } = require('../utils/responseEnvelope');

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, hyphen, and underscore');

const passwordSchema = z.string().min(8).max(72);

const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
});

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});
    if (!result.success) {
      const message = result.error.errors[0]?.message || 'Invalid request body';
      return res.status(400).json(fail(message));
    }
    req.body = result.data;
    return next();
  };
}

module.exports = { registerSchema, loginSchema, validate };
