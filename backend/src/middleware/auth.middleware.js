const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/auth');
const { fail } = require('../utils/responseEnvelope');

module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json(fail('Missing or malformed Authorization header', 401));
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = { userId: payload.userId, role: payload.role };
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json(fail(message, 401));
  }
};
