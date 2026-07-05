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

// Race-safe backstop for the controller's duplicate-text pre-check.
questionSchema.index({ questionText: 1 }, { unique: true });
// Supports the quiz-start aggregation's `{ $match: { active: true } }` stage.
questionSchema.index({ active: 1 });

module.exports = mongoose.model('Question', questionSchema);
