const Question = require('../models/Question');
const Score = require('../models/Score');
const { ok, fail } = require('../utils/responseEnvelope');

/**
 * GET /api/quiz/start
 * Fixed 10 random active questions, without correctAnswer/explanation
 */
const startQuiz = async (req, res, next) => {
  try {
    const questions = await Question.aggregate([
      { $match: { active: true } },
      { $sample: { size: 10 } },
      {
        $project: {
          questionText: 1,
          options: 1,
        },
      },
    ]);

    if (questions.length < 10) {
      return res
        .status(400)
        .json(fail('Not enough active questions in database (need at least 10)'));
    }

    return res.json(ok(questions));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/quiz/submit
 * Body: { answers: [{ questionId, selectedAnswer }] }
 * Returns score + full review data for Review Mode
 */
const submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body;

    // --- input validation ---
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json(fail('Invalid answers format'));
    }

    if (answers.length !== 10) {
      return res.status(400).json(fail('Must submit exactly 10 answers'));
    }

    // check for duplicate questionIds
    const idSet = new Set(answers.map(a => a.questionId));
    if (idSet.size !== answers.length) {
      return res.status(400).json(fail('Duplicate question IDs detected'));
    }

    // validate each answer object
    for (const ans of answers) {
      if (!ans.questionId) {
        return res.status(400).json(fail('Missing questionId'));
      }

      if (
        typeof ans.selectedAnswer !== 'number' ||
        !Number.isInteger(ans.selectedAnswer) ||
        ans.selectedAnswer < 0 ||
        ans.selectedAnswer > 3
      ) {
        return res.status(400).json(fail('selectedAnswer must be an integer 0-3'));
      }
    }

    // --- fetch all questions in one query ---
    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    if (questions.length !== 10) {
      return res.status(400).json(fail('Some question IDs are invalid'));
    }

    const questionMap = {};
    questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });

    // --- score calculation ---
    let score = 0;
    const detailedAnswers = [];

    for (const ans of answers) {
      const question = questionMap[ans.questionId];
      if (!question) continue;

      const isCorrect = ans.selectedAnswer === question.correctAnswer;
      if (isCorrect) score++;

      detailedAnswers.push({
        questionId: question._id,
        selectedAnswer: ans.selectedAnswer,
        isCorrect,
      });
    }

    // --- save to database ---
    const scoreRecord = await Score.create({
      userId: req.user.id,
      score,
      answers: detailedAnswers,
    });

    // --- build review data for Review Mode ---
    const review = detailedAnswers.map(da => {
      const q = questionMap[da.questionId.toString()];

      return {
        questionId: da.questionId,
        questionText: q.questionText,
        options: q.options,
        selectedAnswer: da.selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect: da.isCorrect,
        explanation: q.explanation || null,
      };
    });

    return res.json(
      ok({
        score,
        total: detailedAnswers.length,
        scoreId: scoreRecord._id,
        review,
      })
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quiz/history
 * All quiz attempts for the current user, newest first
 */
const getHistory = async (req, res, next) => {
  try {
    const history = await Score.find({ userId: req.user.id })
      .select('score createdAt')
      .sort({ createdAt: -1 });

    return res.json(ok(history));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quiz/history/:id
 * Single attempt detail with full review data (for re-review)
 */
const getAttemptDetail = async (req, res, next) => {
  try {
    const attempt = await Score.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!attempt) {
      return res.status(404).json(fail('Attempt not found'));
    }

    const questionIds = attempt.answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    const qMap = {};
    questions.forEach(q => {
      qMap[q._id.toString()] = q;
    });

    const review = attempt.answers.map(a => {
      const q = qMap[a.questionId.toString()];

      if (!q) {
        return {
          questionId: a.questionId,
          questionText: '[Question deleted]',
          options: [],
          selectedAnswer: a.selectedAnswer,
          correctAnswer: null,
          isCorrect: a.isCorrect,
          explanation: null,
        };
      }

      return {
        questionId: a.questionId,
        questionText: q.questionText,
        options: q.options,
        selectedAnswer: a.selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect: a.isCorrect,
        explanation: q.explanation || null,
      };
    });

    return res.json(
      ok({
        score: attempt.score,
        total: review.length,
        createdAt: attempt.createdAt,
        review,
      })
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quiz/leaderboard
 * Each user's best score, highest first, with username
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await Score.aggregate([
      {
        $group: {
          _id: '$userId',
          bestScore: { $max: '$score' },
        },
      },
      { $sort: { bestScore: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          username: '$user.username',
          bestScore: 1,
        },
      },
    ]);

    return res.json(ok(leaderboard));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startQuiz,
  submitQuiz,
  getHistory,
  getAttemptDetail,
  getLeaderboard,
};