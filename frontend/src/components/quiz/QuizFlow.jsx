import { useEffect } from 'react';

import { useQuiz } from '../../contexts/QuizContext.jsx';
import {
  CalculatingScreen,
  QuizScreen,
  ResultScreen,
  ReviewScreen,
  StartScreen,
} from './QuizScreens.jsx';
import QuizWorldBackground from './QuizWorldBackground.jsx';

import '../../styles/quizflow.css';

export default function QuizFlow() {
  const { state, finishQuiz } = useQuiz();
  const { phase } = state;

  useEffect(() => {
    if (phase !== 'calculating') return undefined;
    const t = setTimeout(() => {
      finishQuiz();
    }, 2300);
    return () => clearTimeout(t);
  }, [phase, finishQuiz]);

  const screens = {
    start: <StartScreen />,
    quiz: <QuizScreen />,
    calculating: <CalculatingScreen />,
    result: <ResultScreen />,
    review: <ReviewScreen />,
  };

  return (
    <>
      <QuizWorldBackground />
      {screens[phase] ?? <StartScreen />}
    </>
  );
}
