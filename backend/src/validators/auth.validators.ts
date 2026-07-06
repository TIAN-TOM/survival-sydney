import { RequestHandler } from 'express';
import { z } from 'zod';
import { fail } from '../utils/responseEnvelope';

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

/** Request-body types derived from the schemas so controllers share one source of truth. */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

function validate(schema: z.ZodTypeAny): RequestHandler {
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

export { registerSchema, loginSchema, validate };
