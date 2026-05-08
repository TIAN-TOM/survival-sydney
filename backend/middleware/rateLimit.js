const rateLimit = require('express-rate-limit');
const { fail } = require('../utils/responseEnvelope');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) =>
    res.status(429).json(fail('Too many login attempts, try again in a few minutes')),
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) =>
    res.status(429).json(fail('Too many accounts created, try again later')),
});

module.exports = { loginLimiter, registerLimiter };
