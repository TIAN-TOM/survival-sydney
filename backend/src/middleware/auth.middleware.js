const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/auth');
const { fail } = require('../utils/responseEnvelope');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json(fail('Missing or malformed Authorization header', 401));
  }

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json(fail(message, 401));
  }

  try {
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json(fail('User no longer exists', 401));
    }
    req.user = user.toSafeObject();
    return next();
  } catch (err) {
    return next(err);
  }
};
