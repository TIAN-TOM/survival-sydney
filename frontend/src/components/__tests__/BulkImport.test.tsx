import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import BulkImport, { parseImportPayload } from '../BulkImport.tsx';

const validQuestion = {
  questionText: 'What is MERN?',
  options: ['MongoDB', 'Express', 'React', 'Node'],
  correctAnswer: 0,
  active: true,
  explanation: 'A stack used in this assignment.',
  topic: 'general',
};

describe('parseImportPayload', () => {
  test('accepts object form with questions array', () => {
    expect(parseImportPayload(JSON.stringify({ questions: [validQuestion] }))).toEqual([
      validQuestion,
    ]);
  });

  test('accepts raw array form', () => {
    expect(parseImportPayload(JSON.stringify([validQuestion]))).toEqual([validQuestion]);
  });

  test('rejects invalid JSON with a specific message', () => {
    expect(() => parseImportPayload('{not valid json')).toThrow('Invalid JSON format.');
  });

  test('rejects options with the wrong length', () => {
    const badQuestion = {
      ...validQuestion,
      options: ['Only one'],
    };

    expect(() => parseImportPayload(JSON.stringify([badQuestion]))).toThrow(
      'Question 1: options must contain exactly 4 items.'
    );
  });

  test('rejects low-quality and duplicate import rows together', () => {
    const badQuestions = [
      {
        ...validQuestion,
        questionText: '!!!!!!!!',
      },
      {
        ...validQuestion,
        questionText: 'Duplicate options?',
        options: ['Same', 'same', 'Different', 'Another'],
      },
    ];

    expect(() => parseImportPayload(JSON.stringify(badQuestions))).toThrow(
      /Question 1: questionText must include.*Question 2: options must be unique/s
    );
  });

  test('rejects duplicate question text inside one import payload', () => {
    const duplicateQuestions = [
      validQuestion,
      {
        ...validQuestion,
        questionText: '  what   is mern?  ',
      },
    ];

    expect(() => parseImportPayload(JSON.stringify(duplicateQuestions))).toThrow(
      'Question 2: duplicate questionText matches Question 1.'
    );
  });

  test('shows the example as placeholder instead of submit-ready input', () => {
    render(<BulkImport />);

    const textarea = screen.getByLabelText('Question JSON');

    expect(textarea).toHaveValue('');
    expect(textarea).toHaveAttribute('placeholder', expect.stringContaining('What is React?'));
  });
});
