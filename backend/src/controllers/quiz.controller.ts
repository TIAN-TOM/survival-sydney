import { Request, RequestHandler, Response } from 'express';
import Attempt from '../models/Attempt';
import Question, { IQuestion } from '../models/Question';
import Score, { IScoreAnswer } from '../models/Score';
import { QUIZ_LENGTH, OPTIONS_PER_QUESTION, ATTEMPT_TOKEN_TTL_SECONDS } from '../config/quiz';
import { ok, fail } from '../utils/responseEnvelope';
import {
  applyOptionOrder,
  generateOptionOrder,
  isValidPermutation,
  toStartQuizPayload,
} from '../utils/shuffleQuestion';
import {
  AttemptTokenError,
  AttemptTokenPayload,
  signAttemptToken,
  verifyAttemptToken,
} from '../utils/quizAttemptToken';
import mongoose from 'mongoose';

/** Mongo unique-index violation surfaced by Mongoose (double-submit races on attemptId). */
interface DuplicateKeyError extends Error {
  code: number;
  keyPattern?: Record<string, unknown>;
}

const isDuplicateKeyError = (err: unknown): err is DuplicateKeyError =>
  err instanceof Error && 'code' in err && err.code === 11000;

/** Shape produced by the quiz-start aggregation's $project stage. */
interface StartQuizRow {
  _id: mongoose.Types.ObjectId;
  questionText: string;
  options: string[];
  topic: string;
  correctAnswer: number;
}

/**
 * GET /api/quiz/start
 * Fixed 10 random active questions, without correctAnswer/explanation
 */
const startQuiz: RequestHandler = async (req, res, next) => {
  try {
    // Random selection is server-side: filter active questions first, then let MongoDB sample the quiz set.
    const raw = await Question.aggregate<StartQuizRow>([
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
    const { attemptId, token } = signAttemptToken({
      userId: req.user.id,
      questions: withOrder.map(q => ({ _id: q._id, optionOrder: q.optionOrder })),
    });

    // Server-side attempt record: each answer is locked into this document one
    // question at a time (POST /quiz/answer), so answers cannot be revised or
    // batch-submitted from the client.
    await Attempt.create({
      attemptId,
      userId: req.user.id,
      status: 'active',
      expiresAt: new Date(Date.now() + ATTEMPT_TOKEN_TTL_SECONDS * 1000),
      items: withOrder.map(q => ({ questionId: q._id, optionOrder: q.optionOrder })),
    });

    // The browser receives only public quiz data; answer keys and explanations stay server-side at start.
    const questions = withOrder.map(q => toStartQuizPayload(applyOptionOrder(q, q.optionOrder)));

    return res.json(ok({ attemptToken: token, questions }));
  } catch (err) {
    next(err);
  }
};

// Shared attempt-token verification with consistent client messages.
const verifyAttemptOr401 = (req: Request, res: Response): AttemptTokenPayload | null => {
  const { attemptToken } = req.body;

  if (!attemptToken) {
    res.status(400).json(fail('Missing attemptToken'));
    return null;
  }

  try {
    return verifyAttemptToken(attemptToken, req.user.id);
  } catch (err) {
    const code = err instanceof AttemptTokenError ? err.code : undefined;
    const message =
      code === 'expired'
        ? 'Attempt token expired'
        : code === 'wrong_user'
          ? 'Attempt token does not belong to current user'
          : 'Invalid attempt token';
    res.status(401).json(fail(message));
    return null;
  }
};

/**
 * POST /api/quiz/answer
 * Body: { attemptToken, questionId, selectedAnswer }
 * Locks one answer server-side. Once locked it can never be changed —
 * the update below only matches while selectedAnswer is still null.
 */
const answerQuestion: RequestHandler = async (req, res, next) => {
  try {
    const decoded = verifyAttemptOr401(req, res);
    if (!decoded) return undefined;

    const { questionId, selectedAnswer } = req.body;

    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json(fail('Invalid questionId'));
    }

    if (
      typeof selectedAnswer !== 'number' ||
      !Number.isInteger(selectedAnswer) ||
      selectedAnswer < 0 ||
      selectedAnswer >= OPTIONS_PER_QUESTION
    ) {
      return res.status(400).json(fail('selectedAnswer must be an integer 0-3'));
    }

    const qid = String(questionId);
    if (!decoded.items.some(item => item.qid === qid)) {
      return res.status(400).json(fail('Question is not part of this attempt'));
    }

    const attempt = await Attempt.findOne({
      attemptId: decoded.attemptId,
      userId: req.user.id,
    }).lean();

    if (!attempt) {
      return res.status(404).json(fail('Attempt not found or expired'));
    }

    if (attempt.status !== 'active') {
      return res.status(409).json(fail('Attempt already submitted'));
    }

    const target = attempt.items.find(item => String(item.questionId) === qid);
    if (target && target.selectedAnswer !== null) {
      return res.status(409).json(fail('Question already answered'));
    }

    // Questions are presented sequentially; answers must arrive in the same order.
    const nextUnanswered = attempt.items.find(item => item.selectedAnswer === null);
    if (nextUnanswered && String(nextUnanswered.questionId) !== qid) {
      return res.status(409).json(fail('Questions must be answered in order'));
    }

    // Atomic per-question lock: only matches while this answer is still null, so a
    // concurrent or repeated request for the same question cannot overwrite it.
    const updated = await Attempt.findOneAndUpdate(
      {
        attemptId: decoded.attemptId,
        userId: req.user.id,
        status: 'active',
        items: { $elemMatch: { questionId: qid, selectedAnswer: null } },
      },
      {
        $set: {
          'items.$.selectedAnswer': selectedAnswer,
          'items.$.answeredAt': new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      // Raced with another request that locked it first.
      return res.status(409).json(fail('Question already answered'));
    }

    const answeredCount = updated.items.filter(item => item.selectedAnswer !== null).length;
    return res.json(ok({ locked: true, answered: answeredCount, total: QUIZ_LENGTH }));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/quiz/submit
 * Body: { attemptToken }
 * Finalises the attempt: scores the answers already locked server-side via
 * POST /quiz/answer and returns score + full review data for Review Mode.
 */
const submitQuiz: RequestHandler = async (req, res, next) => {
  try {
    // attemptToken is the signed contract for this quiz attempt; expired/tampered/wrong-user tokens stop here.
    const decoded = verifyAttemptOr401(req, res);
    if (!decoded) return undefined;

    // Reject replay before scoring; the unique database index is the final backstop against races.
    if (await Score.exists({ attemptId: decoded.attemptId })) {
      return res.status(409).json(fail('Attempt already submitted'));
    }

    // Answers were locked server-side one question at a time via POST /quiz/answer.
    // The client sends no answers here — the attempt record is the only source of truth.
    const attempt = await Attempt.findOne({
      attemptId: decoded.attemptId,
      userId: req.user.id,
    }).lean();

    if (!attempt) {
      return res.status(404).json(fail('Attempt not found or expired'));
    }

    if (attempt.status !== 'active') {
      return res.status(409).json(fail('Attempt already submitted'));
    }

    const answeredCount = attempt.items.filter(item => item.selectedAnswer !== null).length;
    if (answeredCount !== QUIZ_LENGTH) {
      return res
        .status(400)
        .json(fail(`All questions must be answered before submitting (${answeredCount} of ${QUIZ_LENGTH} answered)`));
    }

    // --- fetch all questions in one query ---
    // Correct answers come from MongoDB; the frontend never supplies correctness or score.
    // .lean() is safe here: below we only read fields and pass plain objects to applyOptionOrder.
    const tokenQids = decoded.items.map(item => item.qid);
    const questions = await Question.find({ _id: { $in: tokenQids } }).lean();

    if (questions.length !== QUIZ_LENGTH) {
      return res.status(400).json(fail('Some question IDs are invalid'));
    }

    const questionMap: Record<string, (typeof questions)[number]> = {};
    questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });

    // --- score calculation, from the server-locked answers only ---
    const detailedAnswers = attempt.items.map(item => {
      const question = questionMap[String(item.questionId)];
      // selectedAnswer is the visible shuffled index; optionOrder maps it back to the stored correctAnswer index.
      // Non-null: the answeredCount check above guarantees every item carries a locked answer.
      const originalIndex = item.optionOrder[item.selectedAnswer!];
      const isCorrect = originalIndex === question.correctAnswer;

      return {
        questionId: question._id,
        selectedAnswer: item.selectedAnswer,
        isCorrect,
        optionOrder: item.optionOrder,
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
      if (isDuplicateKeyError(err) && (!err.keyPattern || err.keyPattern.attemptId)) {
        return res.status(409).json(fail('Attempt already submitted'));
      }
      throw err;
    }

    // Close out the server-side attempt record; the Score document is the durable result.
    await Attempt.updateOne(
      { attemptId: decoded.attemptId },
      { $set: { status: 'submitted' } }
    );

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

/** History rows populate only each answered question's topic. */
type HistoryAnswer = Omit<IScoreAnswer, 'questionId'> & {
  questionId: Pick<IQuestion, 'topic'> | null;
};

/**
 * GET /api/quiz/history
 * All quiz attempts for the current user, newest first
 */
const getHistory: RequestHandler = async (req, res, next) => {
  try {
    const history = await Score.find({ userId: req.user.id })
      .select('score createdAt answers')
      .populate<{ answers: HistoryAnswer[] }>({ path: 'answers.questionId', select: 'topic' })
      .sort({ createdAt: -1 })
      .lean();

    const enriched = history.map((row) => {
      const topics: string[] = [];
      const seen = new Set<string>();
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

/** Review Mode re-hydrates each answer's full question document (or null if deleted). */
type ReviewAnswer = Omit<IScoreAnswer, 'questionId'> & {
  questionId: (mongoose.HydratedDocument<IQuestion>) | null;
};

/**
 * GET /api/quiz/history/:id
 * Single attempt detail with full review data (for re-review)
 */
const getAttemptDetail: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json(fail('Invalid attempt id'));
    }

    const attempt = await Score.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate<{ answers: ReviewAnswer[] }>({
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

/** Shape produced by the leaderboard aggregation's final $project stage. */
interface LeaderboardRow {
  username: string;
  bestScore: number;
  bestAchievedAt: Date;
}

/**
 * GET /api/quiz/leaderboard
 * Top 50 scholars by best score; ties broken by earliest attempt that reached that best.
 */
const getLeaderboard: RequestHandler = async (req, res, next) => {
  try {
    const leaderboard = await Score.aggregate<LeaderboardRow>([
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

export {
  startQuiz,
  answerQuestion,
  submitQuiz,
  getHistory,
  getAttemptDetail,
  getLeaderboard,
};
