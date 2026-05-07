const express = require('express');

const router = express.Router();

const {
  startQuiz,
  submitQuiz,
  getHistory,
  getAttemptDetail,
  getLeaderboard,
} = require('../controllers/quiz.controller');

const authMiddleware = require('../middleware/auth.middleware');

/**
 * GET /api/quiz/start
 * Start a new quiz
 */
router.get('/start', authMiddleware, startQuiz);

/**
 * POST /api/quiz/submit
 * Submit quiz answers
 */
router.post('/submit', authMiddleware, submitQuiz);

/**
 * GET /api/quiz/history
 * Current user's quiz attempts
 */
router.get('/history', authMiddleware, getHistory);

/**
 * GET /api/quiz/history/:id
 * Single attempt detail (Review Mode)
 */
router.get('/history/:id', authMiddleware, getAttemptDetail);

/**
 * GET /api/quiz/leaderboard
 * Public leaderboard
 */
router.get('/leaderboard', getLeaderboard);

module.exports = router;