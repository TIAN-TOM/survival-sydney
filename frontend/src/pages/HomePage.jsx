// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// landing page that routes users into player and admin workflows.
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

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

  const handleStartQuiz = () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          notice: 'Please sign in before starting the quiz.',
          noticeTone: 'info',
        },
      });
      return;
    }

    navigate('/quiz');
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
              onClick={handleStartQuiz}
              type="button"
            >
              <span>Start quiz</span>
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
        </div>

        <aside className="home-quiz-card" aria-label="Quiz preview">
          <div className="home-quiz-card__topline">
            <span>Readiness check</span>
            <strong>10 questions</strong>
          </div>
          <div className="home-quiz-card__score" aria-hidden="true">
            10
          </div>
          <h2>Know what to do before it matters.</h2>
          <p>
            Work through a random mix of Sydney life scenarios, then review every
            answer after submission.
          </p>
        </aside>
      </section>

      <section
        id="practice-areas"
        className="home-section"
        aria-labelledby="practice-areas-heading"
      >
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
