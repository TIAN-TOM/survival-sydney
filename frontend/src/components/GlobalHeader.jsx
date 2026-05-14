import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext.jsx';
import { useQuiz } from '../contexts/QuizContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { quizSealLogoSrc } from '../quizBrandAssets.js';

export function QuizNavLogout() {
  const { logout } = useAuth();
  const { resetToGate } = useQuiz();
  const navigate = useNavigate();

  const handleLogout = () => {
    resetToGate();
    logout();
    navigate('/quiz', { replace: true });
  };

  return (
    <button type="button" className="quiz-top-logout" onClick={handleLogout}>
      Log out
    </button>
  );
}

export function QuizTopPlayer({ user }) {
  const initials = (user?.username || 'P').slice(0, 1).toUpperCase();
  return (
    <div className="review-v7-player" aria-label="Signed-in player">
      <span className="review-v7-av" aria-hidden="true">{initials}</span>
      <span className="review-v7-pname">{user?.username || 'player'}</span>
    </div>
  );
}

const navLinkClass = ({ isActive }) => `quiz-top-link${isActive ? ' quiz-top-link--active' : ''}`;

/**
 * Global app header (quiz-top-navbar styling). Use inside a `quiz-flow-scope` ancestor.
 * Quiz gate + post-login start screen intentionally do not mount this — keep their own layout.
 */
export default function GlobalHeader() {
  const { restart } = useQuiz();
  const { user, isAdmin } = useAuth();
  const { isDarkMode, theme, toggleTheme } = useTheme();

  return (
    <header className="quiz-top-navbar app-global-header" role="banner" aria-label="Site">
      <Link
        className="quiz-top-logo"
        to={isAdmin ? '/admin' : '/quiz'}
        onClick={() => {
          restart();
        }}
      >
        <span className="quiz-top-logo-seal quiz-top-logo-seal--brand" aria-hidden="true">
          <img
            key={theme}
            className="quiz-top-logo-seal-img"
            src={quizSealLogoSrc(isDarkMode)}
            alt=""
          />
        </span>
        Sydney Survival Quiz
      </Link>
      <nav className="quiz-top-links" aria-label="Primary">
        {!isAdmin ? (
          <>
            <Link className="quiz-top-link" to="/quiz" onClick={() => restart()}>
              Home
            </Link>
            <NavLink className={navLinkClass} to="/history">
              History
            </NavLink>
            <NavLink className={navLinkClass} to="/leaderboard">
              Leaderboard
            </NavLink>
          </>
        ) : (
          <NavLink className={navLinkClass} to="/admin">
            Admin
          </NavLink>
        )}
      </nav>
      <div className="quiz-top-right">
        <div className="mode-row">
          <span className="mode-lbl">{isDarkMode ? 'Night' : 'Day'}</span>
          <span className="mode-icon" aria-hidden="true">{isDarkMode ? '🌙' : '☀️'}</span>
          <button
            type="button"
            className="mode-sw"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to day mode' : 'Switch to night mode'}
            aria-pressed={!isDarkMode}
          >
            <span className="mode-kn" />
          </button>
        </div>
        <QuizTopPlayer user={user} />
        <QuizNavLogout />
      </div>
    </header>
  );
}
