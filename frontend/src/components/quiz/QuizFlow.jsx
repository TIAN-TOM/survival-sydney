import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext.jsx';
import { useQuiz } from '../../contexts/QuizContext.jsx';
import {
  CalculatingScreen,
  QuizGateScreen,
  QuizScreen,
  ResultScreen,
  ReviewScreen,
  StartScreen,
} from './QuizScreens.jsx';
import QuizWorldBackground from './QuizWorldBackground.jsx';

export default function QuizFlow() {
  const { state, finishQuiz, setPhase } = useQuiz();
  const { phase } = state;
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (user && phase === 'gate') {
      setPhase('start');
    }
  }, [user, phase, setPhase]);

  useEffect(() => {
    if (!location.state?.openAuth) return;
    if (user) {
      navigate('/quiz', { replace: true, state: {} });
    }
  }, [location.state?.openAuth, user, navigate]);

  useEffect(() => {
    if (phase !== 'calculating') return undefined;
    const t = setTimeout(() => {
      finishQuiz();
    }, 2300);
    return () => clearTimeout(t);
  }, [phase, finishQuiz]);

  const screens = {
    gate: <QuizGateScreen />,
    start: <StartScreen />,
    quiz: <QuizScreen />,
    calculating: <CalculatingScreen />,
    result: <ResultScreen />,
    review: <ReviewScreen />,
  };

  const usePhotoBackdrop = phase !== 'gate' && phase !== 'start';

  return (
    <>
      <QuizWorldBackground usePhotoBackdrop={usePhotoBackdrop} />
      {screens[phase] ?? <QuizGateScreen />}
    </>
  );
}
