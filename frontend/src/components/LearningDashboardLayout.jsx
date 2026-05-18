import QuizWorldBackground from './quiz/QuizWorldBackground.jsx';

/**
 * Shared shell for Quiz History and Learning Debrief — same background, width, and main rhythm.
 */
export default function LearningDashboardLayout({ children, headerExtras = null }) {
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
