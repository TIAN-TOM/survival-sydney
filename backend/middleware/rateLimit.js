const rateLimit = require('express-rate-limit');
const { fail } = require('../utils/responseEnvelope');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json(fail('Too many login attempts, try again in a few minutes')),
});

module.exports = { loginLimiter };
