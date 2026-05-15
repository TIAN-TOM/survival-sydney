const Question = require('../models/Question');
const Score = require('../models/Score');
const { ok, fail } = require('../utils/responseEnvelope');
const { shuffleQuestion, toStartQuizPayload } = require('../utils/shuffleQuestion');
const mongoose = require('mongoose');
/**
 * GET /api/quiz/start
 * Fixed 10 random active questions, without correctAnswer/explanation
 */
const startQuiz = async (req, res, next) => {
  try {
    const raw = await Question.aggregate([
      { $match: { active: true } },
      { $sample: { size: 10 } },
      {
        $project: {
          questionText: 1,
          options: 1,
          topic: 1,
          correctAnswer: 1,
        },
      },
    ]);

    if (raw.length < 10) {
      return res
        .status(400)
        .json(fail('Not enough active questions in database (need at least 10)'));
    }

    const questions = raw.map((q) => toStartQuizPayload(shuffleQuestion(q)));

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

      if (!mongoose.Types.ObjectId.isValid(ans.questionId)) {
        return res.status(400).json(fail('Invalid questionId'));
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

      const shuffled = shuffleQuestion(question.toObject());
      const isCorrect = ans.selectedAnswer === shuffled.correctAnswer;
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
      const shuffled = shuffleQuestion(q.toObject());

      return {
        questionId: da.questionId,
        questionText: shuffled.questionText,
        options: shuffled.options,
        selectedAnswer: da.selectedAnswer,
        correctAnswer: shuffled.correctAnswer,
        isCorrect: da.isCorrect,
        topic: shuffled.topic || 'general',
        explanation: (q.explanation && String(q.explanation).trim()) || null,
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
      .select('score createdAt answers')
      .sort({ createdAt: -1 })
      .lean();

    const idStrings = [];
    for (const row of history) {
      for (const a of row.answers || []) {
        if (a.questionId) idStrings.push(a.questionId.toString());
      }
    }
    const uniqueIds = [...new Set(idStrings)];

    const questions =
      uniqueIds.length > 0
        ? await Question.find({ _id: { $in: uniqueIds } })
            .select('topic')
            .lean()
        : [];

    const topicByQuestionId = {};
    for (const q of questions) {
      topicByQuestionId[q._id.toString()] = q.topic || 'general';
    }

    const enriched = history.map((row) => {
      const topics = [];
      const seen = new Set();
      for (const a of row.answers || []) {
        const tid = a.questionId?.toString();
        const t = tid ? topicByQuestionId[tid] || 'general' : 'general';
        if (!seen.has(t)) {
          seen.add(t);
          topics.push(t);
        }
      }

      return {
        _id: row._id,
        score: row.score,
        createdAt: row.createdAt,
        totalQuestions: row.answers?.length ?? 0,
        topics: topics.slice(0, 8),
      };
    });

    return res.json(ok(enriched));
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json(fail('Invalid attempt id'));
    }

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
          topic: 'general',
          explanation: null,
        };
      }

      const shuffled = shuffleQuestion(q.toObject());

      return {
        questionId: a.questionId,
        questionText: shuffled.questionText,
        options: shuffled.options,
        selectedAnswer: a.selectedAnswer,
        correctAnswer: shuffled.correctAnswer,
        isCorrect: a.isCorrect,
        topic: shuffled.topic || 'general',
        explanation: (q.explanation && String(q.explanation).trim()) || null,
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