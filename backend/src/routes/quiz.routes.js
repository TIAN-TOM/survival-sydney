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
const forbidAdminQuiz = require('../middleware/forbidAdminQuiz.middleware');

/**
 * GET /api/quiz/start
 * Start a new quiz
 */
router.get('/start', authMiddleware, forbidAdminQuiz, startQuiz);

/**
 * POST /api/quiz/submit
 * Submit quiz answers
 */
router.post('/submit', authMiddleware, forbidAdminQuiz, submitQuiz);

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
 * Public leaderboard
 */
router.get('/leaderboard', getLeaderboard);

module.exports = router;