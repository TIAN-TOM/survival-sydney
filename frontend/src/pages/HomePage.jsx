// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// landing page that routes users into player and admin workflows.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useQuiz } from '../contexts/QuizContext.jsx';

const practiceAreas = [
  {
    title: 'Arrival',
    text: 'Customs, documents, banking, phones, and emergency basics.',
  },
  {
    title: 'Transport',
    text: 'Opal, contactless fares, late-night services, and platform safety.',
  },
  {
    title: 'Renting',
    text: 'Inspections, bonds, scams, shared homes, and consumer rights.',
  },
  {
    title: 'Work and Health',
    text: 'TFN, payslips, OSHC, urgent care, and student visa work limits.',
  },
  {
    title: 'Safety',
    text: 'Beach rules, online fraud, emergency calls, and staying aware.',
  },
];

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { startQuiz } = useQuiz();
  const [startError, setStartError] = useState(null);
  const [starting, setStarting] = useState(false);

  const handleStartQuiz = async () => {
    if (!isAuthenticated) {
      navigate('/quiz');
      return;
    }

    setStartError(null);
    setStarting(true);

    try {
      await startQuiz();
      navigate('/quiz');
    } catch (err) {
      setStartError(err.message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="eyebrow">Sydney student life practice</p>
          <h1>Sydney Life Quiz</h1>
          <p className="home-hero__lead">
            A practical readiness check for the everyday decisions international
            students meet after landing in Sydney.
          </p>
          <div className="home-hero__actions" aria-label="Primary navigation">
            <button
              className="button button--primary home-hero__cta"
              disabled={starting}
              onClick={handleStartQuiz}
              type="button"
            >
              <span>{starting ? 'Loading quiz...' : 'Start quiz'}</span>
              <svg
                aria-hidden="true"
                className="home-hero__cta-icon"
                focusable="false"
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
          </div>
          {startError && <p role="alert">{startError}</p>}
        </div>

        <aside className="home-quiz-card" aria-label="Quiz preview">
          <div className="home-quiz-card__topline">
            <span>Readiness check</span>
            <strong>10 questions</strong>
          </div>
          <div className="home-quiz-card__score" aria-hidden="true">10</div>
          <h2>Know what to do before it matters.</h2>
          <p>
            Work through a balanced mix of Sydney life scenarios, then review every
            answer after submission.
          </p>
        </aside>
      </section>

      <section id="practice-areas" className="home-section" aria-labelledby="practice-areas-heading">
        <div className="home-section__header">
          <p className="eyebrow">Practice areas</p>
          <h2 id="practice-areas-heading">Sydney decisions, not trivia.</h2>
        </div>
        <div className="practice-grid">
          {practiceAreas.map((area) => (
            <article className="practice-card" key={area.title}>
              <h3>{area.title}</h3>
              <p>{area.text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <p>COMP5347 Assignment 2 | Group project: Tracy Cui, Raven Ge, Allen Ji, Tom Tian</p>
      </footer>
    </main>
  );
}

export default HomePage;
