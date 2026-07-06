// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// shared rate-limit responses for auth and quiz submission flows.
const rateLimit = require('express-rate-limit');
const { fail } = require('../utils/responseEnvelope');

const limiterResponse = (message) => (req, res) => {
  res.status(429).json(fail(message));
};

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: limiterResponse('Too many login attempts. Please wait and try again.')
});

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limiterResponse('Too many registration attempts. Please wait and try again.')
});

const quizSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: limiterResponse('Too many quiz submissions. Please wait and try again.')
});

// Per-question answers arrive ten per attempt; the limit leaves headroom for
// retries while still stopping scripted hammering.
const quizAnswerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: limiterResponse('Too many answers. Please wait and try again.')
});

module.exports = { loginLimiter, registerLimiter, quizSubmitLimiter, quizAnswerLimiter };
