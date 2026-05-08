// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// application shell, route wiring, navigation, and cross-subsystem layout.
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Register from './components/Register.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { useTheme } from './contexts/ThemeContext.jsx';
import AdminPage from './pages/AdminPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import HomePage from './pages/HomePage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';

function ThemeSplitIcon() {
  return (
    <span className="theme-split" aria-hidden="true">
      <span className="theme-split__half theme-split__half--light">
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="3.6" />
          <path d="M12 3v2.2" />
          <path d="M12 18.8V21" />
          <path d="m5.64 5.64 1.56 1.56" />
          <path d="m16.8 16.8 1.56 1.56" />
          <path d="M3 12h2.2" />
          <path d="M18.8 12H21" />
          <path d="m5.64 18.36 1.56-1.56" />
          <path d="m16.8 7.2 1.56-1.56" />
        </svg>
      </span>
      <span className="theme-split__half theme-split__half--dark">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M20 14.2A7.1 7.1 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2Z" />
        </svg>
      </span>
      <span className="theme-split__divider" />
    </span>
  );
}

function App() {
  const { isAdmin, isAuthenticated, logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const navLinkClass = ({ isActive }) => `app-header__nav-link${isActive ? ' is-active' : ''}`;
  const handleSignOut = () => {
    logout();
    navigate('/login', {
      replace: true,
      state: {
        notice: 'You have signed out.',
        noticeTone: 'success',
      },
    });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="app-header__brand" to="/">
          <span className="app-header__brand-logo" aria-hidden="true">
            <img src="/sydney-life-quiz-icon.png" alt="" />
          </span>
          <span>Sydney Life Quiz</span>
        </Link>
        <nav className="app-header__nav" aria-label="Primary navigation">
          <NavLink className={navLinkClass} to="/history">History</NavLink>
          <NavLink className={navLinkClass} to="/leaderboard">Leaderboard</NavLink>
          {isAdmin && <NavLink className={navLinkClass} to="/admin">Admin</NavLink>}
        </nav>
        <div className="app-header__actions">
          <button
            className={`button app-header__theme-toggle ${isDarkMode ? 'is-dark' : 'is-light'}`}
            type="button"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={isDarkMode}
            title={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <ThemeSplitIcon />
            <span className="theme-toggle__label">{isDarkMode ? 'Dark' : 'Light'}</span>
          </button>
          {isAuthenticated ? (
            <button className="button button--secondary" type="button" onClick={handleSignOut}>
              Sign out {user?.username ? `(${user.username})` : ''}
            </button>
          ) : (
            <Link className="button button--primary app-header__login" to="/login">Sign in</Link>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login adminMode />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/quiz"
          element={(
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/history"
          element={(
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/leaderboard"
          element={(
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/review/:attemptId"
          element={(
            <ProtectedRoute>
              <ReviewPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
