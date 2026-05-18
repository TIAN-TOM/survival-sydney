const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator(arr) {
          return Array.isArray(arr) && arr.length === 4;
        },
        message: 'A question must have exactly 4 options.',
      },
    },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: '', trim: true },
    topic: { type: String, default: 'general', trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
