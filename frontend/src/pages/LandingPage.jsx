import { Link } from 'react-router-dom';

import ThemeFloatingToggle from '../components/ThemeFloatingToggle.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { quizStartHeroImageSrc } from '../quizBrandAssets.js';

export default function LandingPage() {
  const { isDarkMode, theme } = useTheme();

  return (
    <div className="landing-page quiz-flow-scope">
      <div className="auth-immersive__theme" role="region" aria-label="Appearance">
        <ThemeFloatingToggle />
      </div>
      <div className="landing-page__bg" aria-hidden="true">
        <div className="landing-page__bg-pane landing-page__bg-pane--night" />
        <div className="landing-page__bg-pane landing-page__bg-pane--day" />
        <div className="landing-page__bg-veil landing-page__bg-veil--night" />
        <div className="landing-page__bg-veil landing-page__bg-veil--day" />
      </div>

      <main className="landing-page__main">
        <div className="landing-page__hero">
          <div className="landing-page__seal">
            <img
              key={theme}
              className="landing-page__seal-img"
              src={quizStartHeroImageSrc(isDarkMode)}
              alt=""
            />
          </div>
          <h1 className="landing-page__title">Sydney Survival</h1>
          <p className="landing-page__subtitle">Can you survive student life in magical Sydney?</p>

          <nav className="landing-page__nav" aria-label="Get started">
            <Link className="landing-page__cta landing-page__cta--primary" to="/quiz">
              Enter the trials
            </Link>
            <Link className="landing-page__cta landing-page__cta--ghost" to="/login">
              Log in
            </Link>
            <Link className="landing-page__cta landing-page__cta--ghost" to="/register">
              Register
            </Link>
          </nav>

          <p className="landing-page__hint">
            Ten questions, one run — earn your survival badge in the scholar&apos;s trial.
          </p>
          <p className="landing-page__staff-foot">
            <Link to="/admin/login" className="landing-page__staff-link">
              Staff access
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
