const Question = require('../models/Question');
const { ok, fail } = require('../utils/responseEnvelope');

const HAS_MEANINGFUL_TEXT = /[\p{L}\p{N}]/u;
const QUESTION_TEXT_MIN_LENGTH = 8;
const QUESTION_TEXT_MAX_LENGTH = 300;
const OPTION_MAX_LENGTH = 120;
const EXPLANATION_MAX_LENGTH = 800;
const TOPIC_MAX_LENGTH = 60;

const normalizeTextForCompare = value => value.trim().replace(/\s+/g, ' ').toLowerCase();

const getTextQualityError = (label, value, { min = 1, max, allowEmpty = false } = {}) => {
  const trimmed = value.trim();

  if (trimmed === '') {
    return allowEmpty ? null : `${label} cannot be empty`;
  }

  if (trimmed.length < min) {
    return `${label} must be at least ${min} characters`;
  }

  if (max && trimmed.length > max) {
    return `${label} must be at most ${max} characters`;
  }

  if (!HAS_MEANINGFUL_TEXT.test(trimmed)) {
    return `${label} must include at least one letter or number`;
  }

  return null;
};

const isValidQuestionPayload = question => {
  if (!question || typeof question !== 'object') {
    return 'Question body must be an object';
  }

  if (!question.questionText || typeof question.questionText !== 'string') {
    return 'questionText is required and must be a string';
  }

  const questionTextError = getTextQualityError('questionText', question.questionText, {
    min: QUESTION_TEXT_MIN_LENGTH,
    max: QUESTION_TEXT_MAX_LENGTH,
  });

  if (questionTextError) {
    return questionTextError;
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

  for (let i = 0; i < question.options.length; i++) {
    const optionError = getTextQualityError(`option ${i + 1}`, question.options[i], {
      max: OPTION_MAX_LENGTH,
    });

    if (optionError) {
      return optionError;
    }
  }

  const normalizedOptions = question.options.map(normalizeTextForCompare);
  if (new Set(normalizedOptions).size !== normalizedOptions.length) {
    return 'options must be unique';
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

  if (
    question.explanation !== undefined &&
    question.explanation.trim().length > EXPLANATION_MAX_LENGTH
  ) {
    return `explanation must be at most ${EXPLANATION_MAX_LENGTH} characters`;
  }

  if (question.topic !== undefined && typeof question.topic !== 'string') {
    return 'topic must be a string if provided';
  }

  if (question.topic !== undefined) {
    const topicError = getTextQualityError('topic', question.topic, {
      max: TOPIC_MAX_LENGTH,
      allowEmpty: true,
    });

    if (topicError) {
      return topicError;
    }
  }

  return null;
};

const normalizeQuestionPayload = question => {
  const base = {
    questionText: question.questionText.trim(),
    options: question.options.map(option => option.trim()),
    correctAnswer: question.correctAnswer,
    active: question.active !== undefined ? question.active : true,
    explanation: question.explanation ? question.explanation.trim() : '',
  };

  if (question.topic !== undefined) {
    base.topic = question.topic.trim() || 'general';
  }

  return base;
};

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
      return res.status(400).json(fail(validationError));
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
      return res.status(400).json(fail(validationError));
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
      return res.status(404).json(fail('Question not found'));
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
      return res.status(404).json(fail('Question not found'));
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
      return res.status(404).json(fail('Question not found'));
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
      return res.status(400).json(fail('questions must be an array'));
    }

    if (questions.length === 0) {
      return res.status(400).json(fail('questions array cannot be empty'));
    }

    const validationErrors = [];
    const normalizedQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const validationError = isValidQuestionPayload(questions[i]);

      if (validationError) {
        validationErrors.push({
          index: i,
          message: `Question ${i + 1}: ${validationError}`,
        });
        continue;
      }

      normalizedQuestions.push(normalizeQuestionPayload(questions[i]));
    }

    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.map(error => error.message).join('; ');
      return res.status(400).json(
        fail(`Bulk import validation failed: ${errorMessage}`)
      );
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
