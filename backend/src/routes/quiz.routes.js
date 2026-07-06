const express = require('express');

const router = express.Router();

const {
  startQuiz,
  answerQuestion,
  submitQuiz,
  getHistory,
  getAttemptDetail,
  getLeaderboard,
} = require('../controllers/quiz.controller');

const authMiddleware = require('../middleware/auth.middleware');
const forbidAdminQuiz = require('../middleware/forbidAdminQuiz.middleware');
const { quizSubmitLimiter, quizAnswerLimiter } = require('../middleware/rateLimiters');

/**
 * GET /api/quiz/start
 * Start a new quiz
 */
router.get('/start', authMiddleware, forbidAdminQuiz, startQuiz);

/**
 * POST /api/quiz/answer
 * Lock one answer server-side (per-question lock)
 */
router.post('/answer', authMiddleware, forbidAdminQuiz, quizAnswerLimiter, answerQuestion);

/**
 * POST /api/quiz/submit
 * Finalise the attempt and score the server-locked answers
 */
router.post('/submit', authMiddleware, forbidAdminQuiz, quizSubmitLimiter, submitQuiz);

/**
 * GET /api/quiz/history
 * Current user's quiz attempts
 */
router.get('/history', authMiddleware, forbidAdminQuiz, getHistory);

/**
 * GET /api/quiz/history/:id
 * Single attempt detail (Review Mode)
 */
router.get('/history/:id', authMiddleware, forbidAdminQuiz, getAttemptDetail);

/**
 * GET /api/quiz/leaderboard
 * Current user's leaderboard
 */
router.get('/leaderboard', authMiddleware, forbidAdminQuiz, getLeaderboard);

module.exports = router;