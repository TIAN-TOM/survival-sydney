import { useEffect, useLayoutEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext.jsx';
import { useQuiz } from '../../contexts/QuizContext.jsx';
import {
  CalculatingScreen,
  QuizGateScreen,
  QuizScreen,
  ResultScreen,
  StartScreen,
} from './QuizScreens.jsx';
import QuizWorldBackground from './QuizWorldBackground.jsx';

export default function QuizFlow() {
  const { state, finishQuiz, setPhase, resetToGate } = useQuiz();
  const { phase } = state;
  const { user, loading } = useAuth();

  useLayoutEffect(() => {
    if (loading) return;

    if (user && phase === 'gate') {
      setPhase('start');
      return;
    }

    if (!user && phase !== 'gate') {
      resetToGate();
    }
  }, [loading, user, phase, resetToGate, setPhase]);

  useEffect(() => {
    if (phase !== 'calculating') return undefined;
    const t = setTimeout(() => {
      finishQuiz();
    }, 2300);
    return () => clearTimeout(t);
  }, [phase, finishQuiz]);

  const screens = {
    gate: <QuizGateScreen authChecking={loading} />,
    start: <StartScreen />,
    quiz: <QuizScreen />,
    calculating: <CalculatingScreen />,
    result: <ResultScreen />,
  };

  const usePhotoBackdrop = phase !== 'gate' && phase !== 'start';

  return (
    <>
      <QuizWorldBackground usePhotoBackdrop={usePhotoBackdrop} />
      {screens[phase] ?? <QuizGateScreen />}
    </>
  );
}
