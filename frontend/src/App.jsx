// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// application shell, route wiring, navigation, and cross-subsystem layout.
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShellNavbar from './components/AppShellNavbar.jsx';
import Login from './components/Login.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Register from './components/Register.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import AdminPage from './pages/AdminPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ReviewRouteRedirect from './components/ReviewRouteRedirect.jsx';
import ReviewPage from './pages/ReviewPage.jsx';

function App() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isLanding = pathname === '/';
  const isAuthImmersive =
    pathname === '/login' || pathname === '/register' || pathname === '/admin/login';
  /** Unauthenticated /quiz gate: same pre-auth shell as landing (no strip navbar). */
  const isGuestQuizGate = pathname === '/quiz' && !user;
  /** Landing + auth + guest quiz gate: no app shell header (theme lives in-page). */
  const hideAppShellHeader = isLanding || isAuthImmersive || isGuestQuizGate;

  const appClass = [
    'app-layout',
    'app-layout--quiz-fullscreen',
    isLanding ? 'app-layout--landing' : '',
    isAuthImmersive ? 'app-layout--auth-immersive' : '',
    isGuestQuizGate ? 'app-layout--quiz-guest-gate' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={appClass}>
      {!hideAppShellHeader ? (
        <header className="quiz-flow-scope app-layout__header gameplay-hud-stack">
          <AppShellNavbar />
          <div id="gameplay-hud-slot" className="gameplay-hud-slot" />
        </header>
      ) : null}

      <main className="app-layout__body">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login adminMode />} />
          <Route path="/register" element={<Register />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route
            path="/history/:attemptId"
            element={(
              <ProtectedRoute blockAdmin>
                <ReviewPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/history"
            element={(
              <ProtectedRoute blockAdmin>
                <HistoryPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/leaderboard"
            element={(
              <ProtectedRoute blockAdmin>
                <Leaderboard />
              </ProtectedRoute>
            )}
          />
          <Route path="/review/:attemptId" element={<ReviewRouteRedirect />} />
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
      </main>
    </div>
  );
}

export default App;
