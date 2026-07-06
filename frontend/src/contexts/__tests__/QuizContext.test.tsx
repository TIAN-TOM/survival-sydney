import { describe, expect, test } from 'vitest';

import type { PublicQuestion } from '../../types.ts';
import { initialState, quizReducer } from '../QuizContext.tsx';

// Reducer tests only exercise _id; the assertions compare against the same stub objects.
const stubQuestions = (ids: string[]) => ids.map((_id) => ({ _id })) as PublicQuestion[];

describe('quizReducer', () => {
  test('START_QUIZ stores attemptToken and questions', () => {
    const questions = [{ _id: 'q1', questionText: 'Question?', options: ['A', 'B', 'C', 'D'] }];

    const state = quizReducer(initialState, {
      type: 'START_QUIZ',
      payload: { attemptToken: 'attempt-token', questions },
    });

    expect(state.phase).toBe('quiz');
    expect(state.attemptToken).toBe('attempt-token');
    expect(state.questions).toEqual(questions);
  });

  test('LOCK_ANSWER and SUBMIT_ANSWER accumulate answer and advance phase', () => {
    const started = quizReducer(initialState, {
      type: 'START_QUIZ',
      payload: {
        attemptToken: 'attempt-token',
        questions: stubQuestions(['q1']),
      },
    });

    const locked = quizReducer(started, { type: 'LOCK_ANSWER' });
    const submitted = quizReducer(locked, {
      type: 'SUBMIT_ANSWER',
      payload: { questionId: 'q1', sel: 2 },
    });

    expect(locked.answered).toBe(true);
    expect(submitted.answers).toEqual([{ questionId: 'q1', sel: 2 }]);
    expect(submitted.currentQ).toBe(1);
    expect(submitted.answered).toBe(false);
    expect(submitted.phase).toBe('calculating');
  });

  test('RESTART returns to start phase and clears quiz state', () => {
    const started = quizReducer(initialState, {
      type: 'START_QUIZ',
      payload: {
        attemptToken: 'attempt-token',
        questions: stubQuestions(['q1']),
      },
    });

    const restarted = quizReducer(started, { type: 'RESTART' });

    expect(restarted.phase).toBe('start');
    expect(restarted.attemptToken).toBeNull();
    expect(restarted.questions).toEqual([]);
    expect(restarted.answers).toEqual([]);
  });

  test('START_PENDING flags starting and clears any prior error', () => {
    const withError = quizReducer(initialState, { type: 'SET_ERROR', payload: 'boom' });
    const pending = quizReducer(withError, { type: 'START_PENDING' });

    expect(pending.starting).toBe(true);
    expect(pending.error).toBeNull();
  });

  test('SET_ERROR clears the starting flag so the start button re-enables', () => {
    const pending = quizReducer(initialState, { type: 'START_PENDING' });
    const errored = quizReducer(pending, { type: 'SET_ERROR', payload: 'Failed to load questions' });

    expect(errored.starting).toBe(false);
    expect(errored.error).toBe('Failed to load questions');
  });

  test('AUTH_REQUIRED returns to guest gate with a friendly message', () => {
    const started = quizReducer(initialState, {
      type: 'START_QUIZ',
      payload: {
        attemptToken: 'attempt-token',
        questions: stubQuestions(['q1']),
      },
    });

    const gated = quizReducer(started, {
      type: 'AUTH_REQUIRED',
      payload: 'Please sign in again to start a quiz.',
    });

    expect(gated.phase).toBe('gate');
    expect(gated.attemptToken).toBeNull();
    expect(gated.questions).toEqual([]);
    expect(gated.error).toBe('Please sign in again to start a quiz.');
  });
});
