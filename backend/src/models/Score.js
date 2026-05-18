const mongoose = require('mongoose');
const { OPTIONS_PER_QUESTION, QUIZ_LENGTH } = require('../config/quiz');

const answerSchema = new mongoose.Schema(
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
  },
  {
    _id: false,
  }
);

const scoreSchema = new mongoose.Schema(
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
        validator: function (arr) {
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

module.exports = mongoose.model('Score', scoreSchema);
