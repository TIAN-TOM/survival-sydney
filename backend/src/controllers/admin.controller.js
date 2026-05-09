const Question = require('../models/Question');
const { ok, fail } = require('../utils/responseEnvelope');

const isValidQuestionPayload = question => {
  if (!question || typeof question !== 'object') {
    return 'Question body must be an object';
  }

  if (!question.questionText || typeof question.questionText !== 'string') {
    return 'questionText is required and must be a string';
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    return 'options must be an array with exactly 4 items';
  }

  const hasInvalidOption = question.options.some(
    option => typeof option !== 'string' || option.trim() === ''
  );

  if (hasInvalidOption) {
    return 'each option must be a non-empty string';
  }

  if (
    typeof question.correctAnswer !== 'number' ||
    !Number.isInteger(question.correctAnswer) ||
    question.correctAnswer < 0 ||
    question.correctAnswer > 3
  ) {
    return 'correctAnswer must be an integer from 0 to 3';
  }

  if (question.active !== undefined && typeof question.active !== 'boolean') {
    return 'active must be a boolean if provided';
  }

  if (question.explanation !== undefined && typeof question.explanation !== 'string') {
    return 'explanation must be a string if provided';
  }

  return null;
};

const normalizeQuestionPayload = question => ({
  questionText: question.questionText.trim(),
  options: question.options.map(option => option.trim()),
  correctAnswer: question.correctAnswer,
  active: question.active !== undefined ? question.active : true,
  explanation: question.explanation ? question.explanation.trim() : '',
});

/**
 * GET /api/admin/questions
 * Return all questions for admin management.
 */
const getQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    return res.json(ok(questions));
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/admin/questions
 * Create one question.
 */
const createQuestion = async (req, res, next) => {
  try {
    const validationError = isValidQuestionPayload(req.body);

    if (validationError) {
      return res.status(400).json(fail(validationError, 400));
    }

    const question = await Question.create(normalizeQuestionPayload(req.body));
    return res.status(201).json(ok(question));
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/admin/questions/:id
 * Update one question.
 */
const updateQuestion = async (req, res, next) => {
  try {
    const validationError = isValidQuestionPayload(req.body);

    if (validationError) {
      return res.status(400).json(fail(validationError, 400));
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      normalizeQuestionPayload(req.body),
      {
        new: true,
        runValidators: true,
      }
    );

    if (!question) {
      return res.status(404).json(fail('Question not found', 404));
    }

    return res.json(ok(question));
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/admin/questions/:id
 * Delete one question.
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json(fail('Question not found', 404));
    }

    return res.json(ok({ deletedId: question._id }));
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/admin/questions/:id/toggle
 * Toggle active/inactive status.
 */
const toggleQuestionStatus = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json(fail('Question not found', 404));
    }

    question.active = !question.active;
    await question.save();

    return res.json(ok(question));
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/admin/questions/bulk-import
 * Import questions from JSON array.
 */
const bulkImportQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json(fail('questions must be an array', 400));
    }

    if (questions.length === 0) {
      return res.status(400).json(fail('questions array cannot be empty', 400));
    }

    const normalizedQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const validationError = isValidQuestionPayload(questions[i]);

      if (validationError) {
        return res.status(400).json(
          fail(`Question ${i + 1}: ${validationError}`, 400, {
            index: i,
          })
        );
      }

      normalizedQuestions.push(normalizeQuestionPayload(questions[i]));
    }

    const createdQuestions = await Question.insertMany(normalizedQuestions, {
      ordered: true,
    });

    return res.status(201).json(
      ok({
        insertedCount: createdQuestions.length,
        questions: createdQuestions,
      })
    );
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus,
  bulkImportQuestions,
};