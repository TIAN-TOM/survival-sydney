import express from 'express';

const router = express.Router();

import {
  startQuiz,
  answerQuestion,
  submitQuiz,
  getHistory,
  getAttemptDetail,
  getLeaderboard,
} from '../controllers/quiz.controller';

import authMiddleware from '../middleware/auth.middleware';
import forbidAdminQuiz from '../middleware/forbidAdminQuiz.middleware';
import { quizSubmitLimiter, quizAnswerLimiter } from '../middleware/rateLimiters';

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

export default router;
