import express from 'express';

import authMiddleware from '../middleware/auth.middleware';
import adminMiddleware from '../middleware/admin.middleware';

import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus,
  bulkImportQuestions,
} from '../controllers/admin.controller';

const router = express.Router();

// All admin question routes require a valid JWT and admin role.
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/questions
 * Get all questions for admin management.
 */
router.get('/questions', getQuestions);

/**
 * POST /api/admin/questions
 * Create a new question.
 */
router.post('/questions', createQuestion);

/**
 * PUT /api/admin/questions/:id
 * Update an existing question.
 */
router.put('/questions/:id', updateQuestion);

/**
 * DELETE /api/admin/questions/:id
 * Delete a question.
 */
router.delete('/questions/:id', deleteQuestion);

/**
 * PATCH /api/admin/questions/:id/toggle
 * Toggle active/inactive status.
 */
router.patch('/questions/:id/toggle', toggleQuestionStatus);

/**
 * POST /api/admin/questions/bulk-import
 * Bulk import questions from a JSON array.
 */
router.post('/questions/bulk-import', bulkImportQuestions);

export default router;
