import { describe, expect, test } from 'vitest';

import { parseImportPayload } from '../BulkImport.jsx';

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
});
