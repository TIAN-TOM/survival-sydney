import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import QuizFlow from '../QuizFlow.tsx';

interface MockAuthState {
  user: { username: string; role: string } | null;
  loading: boolean;
}

const authState = vi.hoisted(() => ({
  value: { user: null, loading: false } as MockAuthState,
}));

const quizState = vi.hoisted(() => ({
  value: {
    state: { phase: 'gate' } as { phase: string },
    finishQuiz: vi.fn(),
    setPhase: vi.fn(),
    resetToGate: vi.fn(),
  },
}));

vi.mock('../../../contexts/AuthContext.tsx', () => ({
  useAuth: () => authState.value,
}));

vi.mock('../../../contexts/QuizContext.tsx', () => ({
  useQuiz: () => quizState.value,
}));

vi.mock('../QuizScreens.tsx', () => ({
  CalculatingScreen: () => <div>calculating</div>,
  QuizGateScreen: ({ authChecking }: { authChecking?: boolean }) => (
    <div>{authChecking ? 'checking auth' : 'guest gate'}</div>
  ),
  QuizScreen: () => <div>quiz</div>,
  ResultScreen: () => <div>result</div>,
  StartScreen: () => <div>start quiz</div>,
}));

vi.mock('../QuizWorldBackground.tsx', () => ({
  default: () => <div data-testid="quiz-background" />,
}));

describe('QuizFlow auth gating', () => {
  beforeEach(() => {
    authState.value = { user: null, loading: false };
    quizState.value = {
      state: { phase: 'gate' },
      finishQuiz: vi.fn(),
      setPhase: vi.fn(),
      resetToGate: vi.fn(),
    };
  });

  test('waits for stored-token verification before entering start phase', () => {
    authState.value = { user: { username: 'player1', role: 'user' }, loading: true };

    const { getByText } = render(<QuizFlow />);

    expect(getByText('checking auth')).toBeInTheDocument();
    expect(quizState.value.setPhase).not.toHaveBeenCalled();
  });

  test('moves verified players from guest gate to start phase', () => {
    authState.value = { user: { username: 'player1', role: 'user' }, loading: false };

    render(<QuizFlow />);

    expect(quizState.value.setPhase).toHaveBeenCalledWith('start');
    expect(quizState.value.resetToGate).not.toHaveBeenCalled();
  });

  test('returns to guest gate when auth is lost outside the gate', () => {
    authState.value = { user: null, loading: false };
    quizState.value.state = { phase: 'start' };

    render(<QuizFlow />);

    expect(quizState.value.resetToGate).toHaveBeenCalledTimes(1);
    expect(quizState.value.setPhase).not.toHaveBeenCalled();
  });
});
