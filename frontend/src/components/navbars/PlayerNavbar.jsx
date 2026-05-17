import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext.jsx';
import { useQuiz } from '../../contexts/QuizContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { quizSealLogoSrc } from '../../quizBrandAssets.js';

function PlayerNavLogout() {
  const { logout } = useAuth();
  const { confirmActiveQuizExit, resetToGate } = useQuiz();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (!confirmActiveQuizExit()) return;
    resetToGate();
    logout();
    navigate('/quiz', { replace: true, state: null });
  };

  return (
    <button type="button" className="quiz-top-logout" onClick={handleLogout}>
      Log out
    </button>
  );
}

function PlayerNavIdentity({ user }) {
  const initials = (user?.username || 'P').slice(0, 1).toUpperCase();
  return (
    <div className="quiz-top-player" aria-label="Signed-in player">
      <span className="quiz-top-player__avatar" aria-hidden="true">{initials}</span>
      <span className="quiz-top-player__name">{user?.username || 'player'}</span>
    </div>
  );
}

const navLinkClass = ({ isActive }) => `quiz-top-link${isActive ? ' quiz-top-link--active' : ''}`;

/**
 * Player shell: quiz, history (incl. attempt debrief), leaderboard, identity, logout, theme.
 */
export default function PlayerNavbar() {
  const { confirmActiveQuizExit, restart } = useQuiz();
  const { user } = useAuth();
  const { isDarkMode, theme, toggleTheme } = useTheme();

  const handleRestartNavigation = (event) => {
    if (!confirmActiveQuizExit()) {
      event.preventDefault();
      return;
    }
    restart();
  };

  return (
    <header className="quiz-top-navbar player-navbar" role="banner" aria-label="Quiz player">
      <Link
        className="quiz-top-logo"
        to="/quiz"
        data-active-quiz-restart="true"
        onClick={handleRestartNavigation}
      >
        <span className="quiz-top-logo-seal quiz-top-logo-seal--brand" aria-hidden="true">
          <img
            key={theme}
            className="quiz-top-logo-seal-img"
            src={quizSealLogoSrc(isDarkMode)}
            alt=""
          />
        </span>
        Sydney Survival
      </Link>
      <nav className="quiz-top-links" aria-label="Player">
        <NavLink
          to="/quiz"
          end
          className={navLinkClass}
          data-active-quiz-restart="true"
          onClick={handleRestartNavigation}
        >
          Quiz
        </NavLink>
        <NavLink className={navLinkClass} to="/history">
          History
        </NavLink>
        <NavLink className={navLinkClass} to="/leaderboard">
          Leaderboard
        </NavLink>
      </nav>
      <div className="quiz-top-right">
        <PlayerNavIdentity user={user} />
        <PlayerNavLogout />
        <div className="mode-row mode-row--toolbar">
          <span className="sr-only">{isDarkMode ? 'Night mode' : 'Day mode'}</span>
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
      </div>
    </header>
  );
}
