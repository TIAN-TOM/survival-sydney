const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/auth');
const { fail } = require('../utils/responseEnvelope');

module.exports = async (req, res, next) => {
  // Backend middleware is the real security boundary; frontend route guards are UX only.
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json(fail('Missing or malformed Authorization header'));
  }

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch (err) {
    // The expiry message is distinct so the frontend can ask the user to sign in again.
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json(fail(message));
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
