import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import api from '../api/api.js';

const bulkImportFormSchema = z.object({
  jsonText: z.string().trim().min(1, 'JSON input is required.'),
});

const questionImportSchema = z.object({
  questionText: z.string().trim().min(1, 'questionText is required.'),
  options: z
    .array(z.string().trim().min(1, 'each option must be a non-empty string.'))
    .length(4, 'options must contain exactly 4 items.'),
  correctAnswer: z.number().int().min(0).max(3),
  active: z.boolean().optional(),
  explanation: z.string().optional(),
});

const exampleJson = `{
  "questions": [
    {
      "questionText": "What is React?",
      "options": ["Library", "Database", "Operating System", "Browser"],
      "correctAnswer": 0,
      "active": true,
      "explanation": "React is a JavaScript library for building user interfaces."
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

  questions.forEach((question, index) => {
    const result = questionImportSchema.safeParse(question);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      throw new Error(`Question ${index + 1}: ${firstIssue.message}`);
    }
  });

  return questions.map(question => ({
    questionText: question.questionText.trim(),
    options: question.options.map(option => option.trim()),
    correctAnswer: question.correctAnswer,
    active: question.active ?? true,
    explanation: question.explanation?.trim() || '',
  }));
}

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