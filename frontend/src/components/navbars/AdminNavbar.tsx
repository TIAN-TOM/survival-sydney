import { Link, useNavigate } from 'react-router-dom';

import { useAuth, type User } from '../../contexts/AuthContext.tsx';
import { useTheme } from '../../contexts/ThemeContext.tsx';
import { quizSealLogoSrc } from '../../quizBrandAssets.ts';

function AdminNavLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <button type="button" className="quiz-top-logout" onClick={handleLogout}>
      Log out
    </button>
  );
}

function AdminNavIdentity({ user }: { user: User | null }) {
  const label = user?.username || 'Admin';
  const initials = (user?.username || 'A').slice(0, 2).toUpperCase();
  return (
    <div className="quiz-top-player admin-navbar__identity" aria-label="Signed-in administrator">
      <span className="quiz-top-player__avatar" aria-hidden="true">{initials}</span>
      <span className="quiz-top-player__name">{label}</span>
    </div>
  );
}

/**
 * Admin shell: bank tools and theme only. No player quiz/history/leaderboard/review links.
 */
export default function AdminNavbar() {
  const { user } = useAuth();
  const { isDarkMode, theme, toggleTheme } = useTheme();

  return (
    <header className="quiz-top-navbar admin-navbar" role="banner" aria-label="Admin console">
      <Link className="quiz-top-logo admin-navbar__logo" to="/admin">
        <span className="quiz-top-logo-seal quiz-top-logo-seal--brand" aria-hidden="true">
          <img
            key={theme}
            className="quiz-top-logo-seal-img"
            src={quizSealLogoSrc(isDarkMode)}
            alt=""
          />
        </span>
        <span className="admin-navbar__brand-title">Admin Console</span>
      </Link>
      <nav className="quiz-top-links" aria-label="Admin">
        <Link className="quiz-top-link" to="/admin#admin-question-list">
          Question bank
        </Link>
        <Link className="quiz-top-link" to="/admin#admin-bulk-import">
          Bulk import
        </Link>
      </nav>
      <div className="quiz-top-right">
        <AdminNavIdentity user={user} />
        <AdminNavLogout />
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
