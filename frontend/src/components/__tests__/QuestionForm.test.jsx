import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import QuestionForm from '../QuestionForm.jsx';

function fillValidQuestion() {
  fireEvent.change(screen.getByLabelText('Question text'), {
    target: { value: 'Which library builds React user interfaces?' },
  });
  fireEvent.change(screen.getByLabelText('Option A'), {
    target: { value: 'React' },
  });
  fireEvent.change(screen.getByLabelText('Option B'), {
    target: { value: 'MongoDB' },
  });
  fireEvent.change(screen.getByLabelText('Option C'), {
    target: { value: 'Express' },
  });
  fireEvent.change(screen.getByLabelText('Option D'), {
    target: { value: 'Node' },
  });
}

describe('QuestionForm validation', () => {
  test('rejects duplicate answer options before submit', async () => {
    const onSubmit = vi.fn();
    render(<QuestionForm onSubmit={onSubmit} onCancel={() => {}} />);

    fillValidQuestion();
    fireEvent.change(screen.getByLabelText('Option D'), {
      target: { value: 'react' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save question/i }));

    expect(await screen.findByText('Answer options must be unique.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('submits a valid normalized question payload', async () => {
    const onSubmit = vi.fn();
    render(<QuestionForm onSubmit={onSubmit} onCancel={() => {}} />);

    fillValidQuestion();
    fireEvent.click(screen.getByRole('button', { name: /save question/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      questionText: 'Which library builds React user interfaces?',
      options: ['React', 'MongoDB', 'Express', 'Node'],
      correctAnswer: 0,
      active: true,
    }));
  });
});
