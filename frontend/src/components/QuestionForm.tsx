import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { AdminQuestion, QuestionPayload } from '../types.ts';

const HAS_MEANINGFUL_TEXT = /[\p{L}\p{N}]/u;
const QUESTION_TEXT_MIN_LENGTH = 8;
const QUESTION_TEXT_MAX_LENGTH = 300;
const OPTION_MAX_LENGTH = 120;
const EXPLANATION_MAX_LENGTH = 800;
const TOPIC_MAX_LENGTH = 60;

const normalizeTextForCompare = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const meaningfulText = (label: string, { min = 1, max }: { min?: number; max: number }) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`)
    .refine(value => HAS_MEANINGFUL_TEXT.test(value), {
      message: `${label} must include at least one letter or number.`,
    });

const questionFormSchema = z
  .object({
    questionText: meaningfulText('Question text', {
      min: QUESTION_TEXT_MIN_LENGTH,
      max: QUESTION_TEXT_MAX_LENGTH,
    }),
    optionA: meaningfulText('Option A', { max: OPTION_MAX_LENGTH }),
    optionB: meaningfulText('Option B', { max: OPTION_MAX_LENGTH }),
    optionC: meaningfulText('Option C', { max: OPTION_MAX_LENGTH }),
    optionD: meaningfulText('Option D', { max: OPTION_MAX_LENGTH }),
    correctAnswer: z.coerce.number().int().min(0).max(3),
    active: z.coerce.boolean().default(true),
    explanation: z.string().max(EXPLANATION_MAX_LENGTH, `Explanation must be at most ${EXPLANATION_MAX_LENGTH} characters.`).optional(),
    topic: z
      .string()
      .trim()
      .max(TOPIC_MAX_LENGTH, `Topic must be at most ${TOPIC_MAX_LENGTH} characters.`)
      .refine(value => value === '' || HAS_MEANINGFUL_TEXT.test(value), {
        message: 'Topic must include at least one letter or number.',
      })
      .optional(),
  })
  .superRefine((values, ctx) => {
    const options = [values.optionA, values.optionB, values.optionC, values.optionD]
      .map(normalizeTextForCompare);

    if (new Set(options).size !== options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['optionD'],
        message: 'Answer options must be unique.',
      });
    }
  });

type QuestionFormValues = z.infer<typeof questionFormSchema>;

const emptyDefaults: QuestionFormValues = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 0,
  active: true,
  explanation: '',
  topic: 'general',
};

function toFormDefaults(question: AdminQuestion | null): QuestionFormValues {
  if (!question) return emptyDefaults;

  return {
    questionText: question.questionText || '',
    optionA: question.options?.[0] || '',
    optionB: question.options?.[1] || '',
    optionC: question.options?.[2] || '',
    optionD: question.options?.[3] || '',
    correctAnswer: Number.isInteger(question.correctAnswer) ? question.correctAnswer : 0,
    active: question.active ?? true,
    explanation: question.explanation || '',
    topic: question.topic || 'general',
  };
}

interface QuestionFormProps {
  initialQuestion?: AdminQuestion | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: QuestionPayload) => void | Promise<void>;
}

export default function QuestionForm({
  initialQuestion = null,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: QuestionFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: toFormDefaults(initialQuestion),
  });

  useEffect(() => {
    reset(toFormDefaults(initialQuestion));
  }, [initialQuestion, reset]);

  const submitForm = (values: QuestionFormValues) => {
    const payload: QuestionPayload = {
      questionText: values.questionText.trim(),
      options: [
        values.optionA.trim(),
        values.optionB.trim(),
        values.optionC.trim(),
        values.optionD.trim(),
      ],
      correctAnswer: Number(values.correctAnswer),
      active: Boolean(values.active),
      explanation: values.explanation?.trim() || '',
      topic: values.topic?.trim() || 'general',
    };

    onSubmit(payload);
  };

  return (
    <form className="form admin-question-form" onSubmit={handleSubmit(submitForm)}>
      <div className="admin-question-form__scroll">
        <section className="admin-question-form__group admin-question-form__group--question">
          <label className="admin-question-form__field">
            <span className="admin-question-form__label">Question text</span>
            <textarea className="admin-question-form__textarea admin-question-form__textarea--lead" rows={4} {...register('questionText')} />
            {errors.questionText && <span className="form-error">{errors.questionText.message}</span>}
          </label>
        </section>

        <fieldset className="admin-question-form__group admin-question-form__group--options">
          <legend className="admin-question-form__group-title">Options A–D</legend>
          <div className="admin-question-form__options-grid">
            <label className="admin-question-form__field admin-question-form__field--compact">
              <span className="admin-question-form__label">Option A</span>
              <input type="text" {...register('optionA')} />
              {errors.optionA && <span className="form-error">{errors.optionA.message}</span>}
            </label>
            <label className="admin-question-form__field admin-question-form__field--compact">
              <span className="admin-question-form__label">Option B</span>
              <input type="text" {...register('optionB')} />
              {errors.optionB && <span className="form-error">{errors.optionB.message}</span>}
            </label>
            <label className="admin-question-form__field admin-question-form__field--compact">
              <span className="admin-question-form__label">Option C</span>
              <input type="text" {...register('optionC')} />
              {errors.optionC && <span className="form-error">{errors.optionC.message}</span>}
            </label>
            <label className="admin-question-form__field admin-question-form__field--compact">
              <span className="admin-question-form__label">Option D</span>
              <input type="text" {...register('optionD')} />
              {errors.optionD && <span className="form-error">{errors.optionD.message}</span>}
            </label>
          </div>
        </fieldset>

        <section className="admin-question-form__group admin-question-form__group--meta">
          <div className="admin-question-form__grid-2">
            <label className="admin-question-form__field admin-question-form__field--compact">
              <span className="admin-question-form__label">Correct answer</span>
              <select {...register('correctAnswer', { valueAsNumber: true })}>
                <option value={0}>Option A</option>
                <option value={1}>Option B</option>
                <option value={2}>Option C</option>
                <option value={3}>Option D</option>
              </select>
              {errors.correctAnswer && <span className="form-error">{errors.correctAnswer.message}</span>}
            </label>
            <label className="admin-question-form__field admin-question-form__field--compact">
              <span className="admin-question-form__label">Topic</span>
              <input type="text" {...register('topic')} placeholder="e.g. transport" />
              {errors.topic && <span className="form-error">{errors.topic.message}</span>}
            </label>
          </div>
          <label className="admin-question-form__checkbox checkbox-row">
            <input type="checkbox" {...register('active')} />
            <span>Active question</span>
          </label>
        </section>

        <section className="admin-question-form__group admin-question-form__group--explanation">
          <h3 className="admin-question-form__group-title admin-question-form__group-title--secondary">Explanation (Review Mode)</h3>
          <label className="admin-question-form__field">
            <span className="admin-question-form__label admin-question-form__label--muted">Optional — shown to players after the quiz</span>
            <textarea className="admin-question-form__textarea" rows={3} {...register('explanation')} />
            {errors.explanation && <span className="form-error">{errors.explanation.message}</span>}
          </label>
        </section>
      </div>

      <footer className="admin-question-form__footer">
        <button className="admin-question-form__btn admin-question-form__btn--ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="admin-question-form__btn admin-question-form__btn--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save question'}
        </button>
      </footer>
    </form>
  );
}
