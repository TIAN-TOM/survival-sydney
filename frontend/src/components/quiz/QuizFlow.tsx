import { useEffect, useLayoutEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext.tsx';
import { useQuiz } from '../../contexts/QuizContext.tsx';
import {
  CalculatingScreen,
  QuizGateScreen,
  QuizScreen,
  ResultScreen,
  StartScreen,
} from './QuizScreens.tsx';
import SydneyBackground from './SydneyBackground.tsx';

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
    // Submit immediately so the attempt is saved the moment the last answer is in.
    // The calculating animation's minimum duration is handled inside finishQuiz, after the save.
    finishQuiz();
    return undefined;
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
      <SydneyBackground usePhotoBackdrop={usePhotoBackdrop} />
      {screens[phase] ?? <QuizGateScreen />}
    </>
  );
}
