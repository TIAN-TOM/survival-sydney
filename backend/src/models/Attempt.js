const mongoose = require('mongoose');
const { OPTIONS_PER_QUESTION, QUIZ_LENGTH } = require('../config/quiz');

/**
 * Server-side record of an in-progress quiz attempt.
 *
 * Created at GET /quiz/start alongside the signed attempt token. Each answer is
 * locked into `items` one question at a time via POST /quiz/answer (an atomic
 * update that only succeeds while selectedAnswer is still null), so a player
 * cannot revise an answer after moving on. POST /quiz/submit scores exclusively
 * from these server-stored answers — the client never sends answers in bulk.
 */
const attemptItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    optionOrder: {
      type: [Number],
      required: true,
      validate: {
        validator: function (arr) {
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
    // null = not yet answered. Once set, the atomic lock prevents any change.
    selectedAnswer: {
      type: Number,
      min: 0,
      max: OPTIONS_PER_QUESTION - 1,
      default: null,
    },
    answeredAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    attemptId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'submitted'],
      default: 'active',
    },
    // Mirrors the signed attempt token TTL; the TTL index below cleans up
    // abandoned attempts once the token could no longer be used anyway.
    expiresAt: {
      type: Date,
      required: true,
    },
    items: {
      type: [attemptItemSchema],
      required: true,
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length === QUIZ_LENGTH;
        },
        message: `An attempt must contain exactly ${QUIZ_LENGTH} questions.`,
      },
    },
  },
  { timestamps: true }
);

attemptSchema.index({ attemptId: 1 }, { unique: true });
attemptSchema.index({ userId: 1, status: 1 });
// MongoDB TTL: remove attempt records shortly after their token expires.
attemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Attempt', attemptSchema);
