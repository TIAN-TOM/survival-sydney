import { RequestHandler } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { UserDocument } from '../models/User';
import { getJwtSecret, JWT_ALGORITHM, SessionTokenPayload } from '../config/auth';
import { ok, fail } from '../utils/responseEnvelope';
import type { LoginInput, RegisterInput } from '../validators/auth.validators';

/** Mongo unique-index violation surfaced by Mongoose (register races on username/email). */
interface DuplicateKeyError extends Error {
  code: number;
  keyPattern?: Record<string, unknown>;
}

const isDuplicateKeyError = (err: unknown): err is DuplicateKeyError =>
  err instanceof Error && 'code' in err && err.code === 11000;

// JWT_EXPIRES_IN is a free-form env string (e.g. "2h"); jsonwebtoken's template-literal
// type cannot be proven from process.env, so it is narrowed here by convention.
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '2h') as SignOptions['expiresIn'];

// JWT carries identity claims only; password safety is handled by bcrypt before this point.
const signToken = (user: UserDocument) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role } satisfies SessionTokenPayload,
    getJwtSecret(),
    { expiresIn: jwtExpiresIn, algorithm: JWT_ALGORITHM }
  );

export const register: RequestHandler<ParamsDictionary, unknown, RegisterInput> = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });
    if (existing) {
      const message = existing.username === normalizedUsername
        ? 'Username already taken'
        : 'Email already registered';
      return res.status(409).json(fail(message));
    }

    const user = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      role: 'user',
    });
    await user.setPassword(password);
    await user.save();

    return res.status(201).json(
      ok({
        user: user.toSafeObject(),
        message: 'Account created. Sign in to continue.',
      })
    );
  } catch (err) {
    // Two concurrent registrations can pass the pre-check and collide on the unique index;
    // surface that as a 409 conflict rather than a generic 500.
    if (isDuplicateKeyError(err)) {
      const field = err.keyPattern && err.keyPattern.email ? 'Email' : 'Username';
      const message = field === 'Email' ? 'Email already registered' : 'Username already taken';
      return res.status(409).json(fail(message));
    }
    return next(err);
  }
};

export const login: RequestHandler<ParamsDictionary, unknown, LoginInput> = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase().trim() });

    // Keep username/password failures identical so login does not reveal which field was wrong.
    if (!user) {
      return res.status(401).json(fail('Invalid username or password'));
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json(fail('Invalid username or password'));
    }

    const token = signToken(user);
    return res.json(ok({ token, user: user.toSafeObject() }));
  } catch (err) {
    return next(err);
  }
};

export const me: RequestHandler = (req, res) => {
  return res.json(ok({ user: req.user }));
};
