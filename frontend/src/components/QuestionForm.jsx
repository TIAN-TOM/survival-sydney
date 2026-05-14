import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const questionFormSchema = z.object({
  questionText: z.string().trim().min(1, 'Question text is required.'),
  optionA: z.string().trim().min(1, 'Option A is required.'),
  optionB: z.string().trim().min(1, 'Option B is required.'),
  optionC: z.string().trim().min(1, 'Option C is required.'),
  optionD: z.string().trim().min(1, 'Option D is required.'),
  correctAnswer: z.coerce.number().int().min(0).max(3),
  active: z.coerce.boolean().default(true),
  explanation: z.string().optional(),
  topic: z.string().optional(),
});

const emptyDefaults = {
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

function toFormDefaults(question) {
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

export default function QuestionForm({
  initialQuestion = null,
  isSubmitting = false,
  onCancel,
  onSubmit,
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(questionFormSchema),
    defaultValues: toFormDefaults(initialQuestion),
  });

  useEffect(() => {
    reset(toFormDefaults(initialQuestion));
  }, [initialQuestion, reset]);

  const submitForm = (values) => {
    const payload = {
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
