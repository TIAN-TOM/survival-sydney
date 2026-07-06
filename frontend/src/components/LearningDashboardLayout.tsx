import type { ReactNode } from 'react';

import QuizWorldBackground from './quiz/QuizWorldBackground.tsx';

/**
 * Shared shell for Quiz History and Learning Debrief — same background, width, and main rhythm.
 */
export default function LearningDashboardLayout({
  children,
  headerExtras = null,
}: {
  children: ReactNode;
  headerExtras?: ReactNode;
}) {
  return (
    <div className="quiz-flow-scope quiz-review-shell hist-learning-page">
      <QuizWorldBackground usePhotoBackdrop />
      {headerExtras}
      <main className="review-page quiz-review-page">
        <div className="rv-center">{children}</div>
      </main>
    </div>
  );
}
