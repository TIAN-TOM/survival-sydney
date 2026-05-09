const { z } = require('zod');
const { fail } = require('../utils/responseEnvelope');

const registerSchema = z.object({
  username: z.string().trim().min(3).max(30),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  username: z.string().trim().min(3).max(30),
  password: z.string().min(6),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});
    if (!result.success) {
      const message = result.error.errors[0]?.message || 'Invalid request body';
      return res.status(400).json(fail(message, 400, result.error.format()));
    }
    req.body = result.data;
    return next();
  };
}

module.exports = { registerSchema, loginSchema, validate };
