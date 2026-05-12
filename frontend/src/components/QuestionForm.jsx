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

  const submitForm = values => {
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
    <form className="form" onSubmit={handleSubmit(submitForm)}>
      <label>
        Question text
        <textarea rows="3" {...register('questionText')} />
        {errors.questionText && <span className="form-error">{errors.questionText.message}</span>}
      </label>

      <div className="form-grid">
        <label>
          Option A
          <input type="text" {...register('optionA')} />
          {errors.optionA && <span className="form-error">{errors.optionA.message}</span>}
        </label>

        <label>
          Option B
          <input type="text" {...register('optionB')} />
          {errors.optionB && <span className="form-error">{errors.optionB.message}</span>}
        </label>

        <label>
          Option C
          <input type="text" {...register('optionC')} />
          {errors.optionC && <span className="form-error">{errors.optionC.message}</span>}
        </label>

        <label>
          Option D
          <input type="text" {...register('optionD')} />
          {errors.optionD && <span className="form-error">{errors.optionD.message}</span>}
        </label>
      </div>

      <label>
        Correct answer
        <select {...register('correctAnswer', { valueAsNumber: true })}>
          <option value={0}>Option A</option>
          <option value={1}>Option B</option>
          <option value={2}>Option C</option>
          <option value={3}>Option D</option>
        </select>
        {errors.correctAnswer && <span className="form-error">{errors.correctAnswer.message}</span>}
      </label>

      <label>
        Topic (slug or label, e.g. transport)
        <input type="text" {...register('topic')} placeholder="general" />
        {errors.topic && <span className="form-error">{errors.topic.message}</span>}
      </label>

      <label>
        Explanation for Review Mode
        <textarea rows="3" {...register('explanation')} />
        {errors.explanation && <span className="form-error">{errors.explanation.message}</span>}
      </label>

      <label className="checkbox-row">
        <input type="checkbox" {...register('active')} />
        Active question
      </label>

      <div className="button-row">
        <button className="button button--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Question'}
        </button>

        <button className="button button--secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}