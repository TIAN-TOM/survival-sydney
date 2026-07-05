const Question = require('../models/Question');
const Score = require('../models/Score');
const { QUIZ_LENGTH, OPTIONS_PER_QUESTION } = require('../config/quiz');
const { ok, fail } = require('../utils/responseEnvelope');
const {
  applyOptionOrder,
  generateOptionOrder,
  isValidPermutation,
  toStartQuizPayload,
} = require('../utils/shuffleQuestion');
const { signAttemptToken, verifyAttemptToken } = require('../utils/quizAttemptToken');
const mongoose = require('mongoose');
/**
 * GET /api/quiz/start
 * Fixed 10 random active questions, without correctAnswer/explanation
 */
const startQuiz = async (req, res, next) => {
  try {
    // Random selection is server-side: filter active questions first, then let MongoDB sample the quiz set.
    const raw = await Question.aggregate([
      { $match: { active: true } },
      { $sample: { size: QUIZ_LENGTH } },
      {
        $project: {
          questionText: 1,
          options: 1,
          topic: 1,
          correctAnswer: 1,
        },
      },
    ]);

    // Reject start rather than creating a partial quiz when the active bank is too small.
    if (raw.length < QUIZ_LENGTH) {
      return res
        .status(400)
        .json(fail(`Not enough active questions in database (need at least ${QUIZ_LENGTH})`));
    }

    // Every attempt gets fresh option permutations; the same order is signed and later used for scoring.
    const withOrder = raw.map(q => ({
      ...q,
      optionOrder: generateOptionOrder(),
    }));
    const { token } = signAttemptToken({
      userId: req.user.id,
      questions: withOrder.map(q => ({ _id: q._id, optionOrder: q.optionOrder })),
    });

    // The browser receives only public quiz data; answer keys and explanations stay server-side at start.
    const questions = withOrder.map(q => toStartQuizPayload(applyOptionOrder(q, q.optionOrder)));

    return res.json(ok({ attemptToken: token, questions }));
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
    const { attemptToken, answers } = req.body;

    if (!attemptToken) {
      return res.status(400).json(fail('Missing attemptToken'));
    }

    let decoded;
    try {
      // attemptToken is the signed contract for this quiz attempt; expired/tampered/wrong-user tokens stop here.
      decoded = verifyAttemptToken(attemptToken, req.user.id);
    } catch (err) {
      const message =
        err.code === 'expired'
          ? 'Attempt token expired'
          : err.code === 'wrong_user'
            ? 'Attempt token does not belong to current user'
            : 'Invalid attempt token';
      return res.status(401).json(fail(message));
    }

    // --- input validation ---
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json(fail('Invalid answers format'));
    }

    if (answers.length !== QUIZ_LENGTH) {
      return res.status(400).json(fail(`Must submit exactly ${QUIZ_LENGTH} answers`));
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
        ans.selectedAnswer >= OPTIONS_PER_QUESTION
      ) {
        return res.status(400).json(fail('selectedAnswer must be an integer 0-3'));
      }
    }

    const answerByQid = Object.fromEntries(answers.map(a => [String(a.questionId), a]));
    const tokenQids = decoded.items.map(item => item.qid);
    const tokenQidSet = new Set(tokenQids);
    const submittedQids = answers.map(a => String(a.questionId));
    const submittedQidSet = new Set(submittedQids);

    // Prevent question swapping: the submitted IDs must match the token's signed question set exactly.
    if (
      submittedQids.length !== tokenQids.length ||
      submittedQidSet.size !== tokenQidSet.size ||
      !tokenQids.every(qid => submittedQidSet.has(qid))
    ) {
      return res.status(400).json(fail('Submitted question IDs do not match attempt token'));
    }

    // Reject replay before scoring; the unique database index is the final backstop against races.
    if (await Score.exists({ attemptId: decoded.attemptId })) {
      return res.status(409).json(fail('Attempt already submitted'));
    }

    // --- fetch all questions in one query ---
    // Correct answers come from MongoDB; the frontend never supplies correctness or score.
    // .lean() is safe here: below we only read fields and pass plain objects to applyOptionOrder.
    const questions = await Question.find({ _id: { $in: tokenQids } }).lean();

    if (questions.length !== QUIZ_LENGTH) {
      return res.status(400).json(fail('Some question IDs are invalid'));
    }

    const questionMap = {};
    questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });

    // --- score calculation ---
    const detailedAnswers = decoded.items.map(item => {
      const question = questionMap[item.qid];
      const ans = answerByQid[item.qid];
      // selectedAnswer is the visible shuffled index; optionOrder maps it back to the stored correctAnswer index.
      const originalIndex = item.order[ans.selectedAnswer];
      const isCorrect = originalIndex === question.correctAnswer;

      return {
        questionId: question._id,
        selectedAnswer: ans.selectedAnswer,
        isCorrect,
        optionOrder: item.order,
      };
    });
    const score = detailedAnswers.filter(answer => answer.isCorrect).length;

    // --- save to database ---
    let scoreRecord;
    try {
      // Persist optionOrder with each answer so Review Mode can recreate the exact shuffled attempt.
      scoreRecord = await Score.create({
        userId: req.user.id,
        attemptId: decoded.attemptId,
        score,
        answers: detailedAnswers,
      });
    } catch (err) {
      // Handles a double-submit race if two requests pass the pre-check at nearly the same time.
      if (err && err.code === 11000 && (!err.keyPattern || err.keyPattern.attemptId)) {
        return res.status(409).json(fail('Attempt already submitted'));
      }
      throw err;
    }

    // --- build review data for Review Mode ---
    const review = detailedAnswers.map(da => {
      const q = questionMap[da.questionId.toString()];
      const shuffled = applyOptionOrder(q, da.optionOrder);

      return {
        questionId: da.questionId,
        questionText: shuffled.questionText,
        options: shuffled.options,
        selectedAnswer: da.selectedAnswer,
        correctAnswer: shuffled.correctAnswer,
        isCorrect: da.isCorrect,
        optionOrder: da.optionOrder,
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
      .populate({ path: 'answers.questionId', select: 'topic' })
      .sort({ createdAt: -1 })
      .lean();

    const enriched = history.map((row) => {
      const topics = [];
      const seen = new Set();
      for (const a of row.answers || []) {
        const t = a.questionId?.topic || 'general';
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
    }).populate({
      path: 'answers.questionId',
      select: 'questionText options correctAnswer topic explanation',
    });

    if (!attempt) {
      return res.status(404).json(fail('Attempt not found'));
    }

    const review = attempt.answers.map(a => {
      const q = a.questionId;

      if (!q) {
        return {
          questionId: null,
          questionText: '[Question deleted]',
          options: [],
          selectedAnswer: a.selectedAnswer,
          correctAnswer: null,
          isCorrect: a.isCorrect,
          optionOrder: isValidPermutation(a.optionOrder) ? a.optionOrder : [],
          topic: 'general',
          explanation: null,
        };
      }

      const order = isValidPermutation(a.optionOrder) ? a.optionOrder : [0, 1, 2, 3];
      const shuffled = applyOptionOrder(q.toObject(), order);

      return {
        questionId: q._id,
        questionText: shuffled.questionText,
        options: shuffled.options,
        selectedAnswer: a.selectedAnswer,
        correctAnswer: shuffled.correctAnswer,
        isCorrect: a.isCorrect,
        optionOrder: order,
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

const LEADERBOARD_TOP_N = 50;

/**
 * GET /api/quiz/leaderboard
 * Top 50 scholars by best score; ties broken by earliest attempt that reached that best.
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await Score.aggregate([
      { $sort: { userId: 1, score: -1, createdAt: 1 } },
      {
        $group: {
          _id: '$userId',
          bestScore: { $first: '$score' },
          bestAchievedAt: { $first: '$createdAt' },
        },
      },
      { $sort: { bestScore: -1, bestAchievedAt: 1 } },
      { $limit: LEADERBOARD_TOP_N },
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
          bestAchievedAt: 1,
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
