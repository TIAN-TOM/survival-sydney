import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { getJwtSecret, JWT_ALGORITHM } from '../config/auth';
import { fail } from '../utils/responseEnvelope';

const authMiddleware: RequestHandler = async (req, res, next) => {
  // Backend middleware is the real security boundary; frontend route guards are UX only.
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json(fail('Missing or malformed Authorization header'));
  }

  let payload: string | jwt.JwtPayload;
  try {
    // Pin the algorithm so a token cannot be forged with "alg: none" or a swapped algorithm.
    payload = jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });
  } catch (err) {
    // The expiry message is distinct so the frontend can ask the user to sign in again.
    const message = err instanceof Error && err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json(fail(message));
  }

  // Quiz-attempt tokens are signed with the same key but are not session credentials.
  // Rejecting the `purpose` claim here stops token-type confusion (using an attempt token as a login).
  // A bare-string payload is equally foreign: our session tokens always carry object claims.
  if (typeof payload === 'string' || payload.purpose) {
    return res.status(401).json(fail('Invalid token'));
  }

  try {
    // Reload the user on every request so deleted accounts or role changes take effect immediately.
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json(fail('User no longer exists'));
    }
    req.user = user.toSafeObject();
    return next();
  } catch (err) {
    return next(err);
  }
};

export default authMiddleware;
