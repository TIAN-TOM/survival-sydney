import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import api from '../api/api.js';

const HAS_MEANINGFUL_TEXT = /[\p{L}\p{N}]/u;
const QUESTION_TEXT_MIN_LENGTH = 8;
const QUESTION_TEXT_MAX_LENGTH = 300;
const OPTION_MAX_LENGTH = 120;
const EXPLANATION_MAX_LENGTH = 800;
const TOPIC_MAX_LENGTH = 60;

const normalizeTextForCompare = value => value.trim().replace(/\s+/g, ' ').toLowerCase();

const meaningfulText = (label, { min = 1, max } = {}) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`)
    .refine(value => HAS_MEANINGFUL_TEXT.test(value), {
      message: `${label} must include at least one letter or number.`,
    });

const bulkImportFormSchema = z.object({
  jsonText: z.string().trim().min(1, 'JSON input is required.'),
});

const questionImportSchema = z
  .object({
    questionText: meaningfulText('questionText', {
      min: QUESTION_TEXT_MIN_LENGTH,
      max: QUESTION_TEXT_MAX_LENGTH,
    }),
    options: z
      .array(meaningfulText('each option', { max: OPTION_MAX_LENGTH }))
      .length(4, 'options must contain exactly 4 items.'),
    correctAnswer: z.number().int().min(0).max(3),
    active: z.boolean().optional(),
    explanation: z.string().max(EXPLANATION_MAX_LENGTH, `explanation must be at most ${EXPLANATION_MAX_LENGTH} characters.`).optional(),
    topic: z
      .string()
      .trim()
      .max(TOPIC_MAX_LENGTH, `topic must be at most ${TOPIC_MAX_LENGTH} characters.`)
      .refine(value => value === '' || HAS_MEANINGFUL_TEXT.test(value), {
        message: 'topic must include at least one letter or number.',
      })
      .optional(),
  })
  .superRefine((question, ctx) => {
    if (!Array.isArray(question.options) || question.options.length !== 4) return;

    const options = question.options.map(normalizeTextForCompare);
    if (new Set(options).size !== options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'options must be unique.',
      });
    }
  });

const exampleJson = `{
  "questions": [
    {
      "questionText": "What is React?",
      "options": ["Library", "Database", "Operating System", "Browser"],
      "correctAnswer": 0,
      "active": true,
      "explanation": "React is a JavaScript library for building user interfaces.",
      "topic": "general"
    }
  ]
}`;

function parseImportPayload(jsonText) {
  let parsed;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid JSON format.');
  }

  const questions = Array.isArray(parsed) ? parsed : parsed.questions;

  if (!Array.isArray(questions)) {
    throw new Error('Input must be a JSON array or an object with a questions array.');
  }

  if (questions.length === 0) {
    throw new Error('questions array cannot be empty.');
  }

  const validationErrors = [];

  questions.forEach((question, index) => {
    const result = questionImportSchema.safeParse(question);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      validationErrors.push(`Question ${index + 1}: ${firstIssue.message}`);
    }
  });

  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join('; '));
  }

  return questions.map(question => ({
    questionText: question.questionText.trim(),
    options: question.options.map(option => option.trim()),
    correctAnswer: question.correctAnswer,
    active: question.active ?? true,
    explanation: question.explanation?.trim() || '',
    topic: question.topic?.trim() || 'general',
  }));
}

export { parseImportPayload };

export default function BulkImport({ onImportSuccess }) {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(bulkImportFormSchema),
    defaultValues: {
      jsonText: exampleJson,
    },
  });

  const submitImport = async values => {
    try {
      setImporting(true);
      setMessage(null);

      const questions = parseImportPayload(values.jsonText);
      const result = await api.post('/admin/questions/bulk-import', { questions });

      setMessage({
        type: 'success',
        text: `Imported ${result.insertedCount ?? questions.length} question(s).`,
      });

      reset({ jsonText: exampleJson });
      await onImportSuccess?.(result);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Bulk import failed.',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit(submitImport)}>
      <label>
        Question JSON
        <textarea rows="12" spellCheck="false" {...register('jsonText')} />
        {errors.jsonText && <span className="form-error">{errors.jsonText.message}</span>}
      </label>

      {message && (
        <div className={`notice notice--${message.type}`} role="status">
          {message.text}
        </div>
      )}

      <button className="button button--primary" type="submit" disabled={importing}>
        {importing ? 'Importing...' : 'Import Questions'}
      </button>
    </form>
  );
}
