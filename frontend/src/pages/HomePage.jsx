// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// landing page that routes users into player and admin workflows.
import { Link, useNavigate } from 'react-router-dom';
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

  return (
    <main className="home-page">
      <section className="home-intro" aria-labelledby="home-intro-heading">
        <p className="eyebrow">Sydney student life</p>
        <h1 id="home-intro-heading">Sydney Life Quiz</h1>
        <p className="home-intro__lead">
          The full quiz experience — title screen, 10 questions, results, and review — opens on the
          dedicated quiz page after you sign in.
        </p>
        <div className="home-intro__actions">
          {isAuthenticated ? (
            <Link className="button button--primary home-intro__cta" to="/quiz">
              Open quiz
            </Link>
          ) : (
            <button
              type="button"
              className="button button--primary home-intro__cta"
              onClick={() =>
                navigate('/login', {
                  state: {
                    notice: 'Please sign in to open the quiz.',
                    noticeTone: 'info',
                  },
                })
              }
            >
              Sign in to play
            </button>
          )}
          <p className="home-intro__hint">Practice topics below — then head to the quiz when you are ready.</p>
        </div>
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