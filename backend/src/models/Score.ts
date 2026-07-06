import mongoose, { HydratedDocument, Types } from 'mongoose';
import { OPTIONS_PER_QUESTION, QUIZ_LENGTH } from '../config/quiz';

export interface IScoreAnswer {
  questionId: Types.ObjectId;
  selectedAnswer: number;
  isCorrect: boolean;
  optionOrder: number[];
}

export interface IScore {
  userId: Types.ObjectId;
  score: number;
  attemptId: string;
  answers: IScoreAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

export type ScoreDocument = HydratedDocument<IScore>;

const answerSchema = new mongoose.Schema<IScoreAnswer>(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    optionOrder: {
      type: [Number],
      required: true,
      validate: {
        validator: function (arr: number[]) {
          return (
            Array.isArray(arr) &&
            arr.length === OPTIONS_PER_QUESTION &&
            new Set(arr).size === OPTIONS_PER_QUESTION &&
            arr.every(n => Number.isInteger(n) && n >= 0 && n < OPTIONS_PER_QUESTION)
          );
        },
        message: 'optionOrder must be a permutation of 0..3',
      },
    },
  },
  {
    _id: false,
  }
);

const scoreSchema = new mongoose.Schema<IScore>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    attemptId: {
      type: String,
      required: true,
    },
    answers: {
      type: [answerSchema],
      required: true,
      validate: {
        validator: function (arr: IScoreAnswer[]) {
          return Array.isArray(arr) && arr.length === QUIZ_LENGTH;
        },
        message: `A quiz attempt must contain exactly ${QUIZ_LENGTH} answers.`,
      },
    },
  },
  {
    timestamps: true,
  }
);

scoreSchema.index(
  { attemptId: 1 },
  {
    unique: true,
    partialFilterExpression: { attemptId: { $type: 'string' } },
  }
);

// Covers the leaderboard aggregation's leading $sort {userId, score, createdAt};
// the userId prefix also serves the per-user history filter.
scoreSchema.index({ userId: 1, score: -1, createdAt: 1 });
// Index-backed sort for GET /quiz/history (newest first per user).
scoreSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IScore>('Score', scoreSchema);
