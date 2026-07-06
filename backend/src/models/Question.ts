import mongoose, { HydratedDocument } from 'mongoose';

export interface IQuestion {
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type QuestionDocument = HydratedDocument<IQuestion>;

const questionSchema = new mongoose.Schema<IQuestion>(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator(arr: string[]) {
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

export default mongoose.model<IQuestion>('Question', questionSchema);
