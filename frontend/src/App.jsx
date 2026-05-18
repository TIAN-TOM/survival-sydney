// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// application shell, route wiring, navigation, and cross-subsystem layout.
import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShellNavbar from './components/AppShellNavbar.jsx';
import Login from './components/Login.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Register from './components/Register.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { useQuiz } from './contexts/QuizContext.jsx';
import AdminPage from './pages/AdminPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ReviewRouteRedirect from './components/ReviewRouteRedirect.jsx';
import ReviewPage from './pages/ReviewPage.jsx';

function motionShellClass(pathname) {
  if (pathname.startsWith('/admin') || pathname === '/bosscoming') return 'motion-context--admin';
  if (pathname === '/quiz') return 'motion-context--quiz';
  if (pathname === '/leaderboard') return 'motion-page-enter motion-context--leaderboard';
  if (pathname === '/history') return 'motion-page-enter motion-context--history';
  if (pathname.startsWith('/history/')) return 'motion-page-enter motion-context--review';
  return 'motion-page-enter';
}

function ActiveQuizNavigationGuard() {
  const { hasActiveQuiz, activeQuizLeaveMessage, resetToGate } = useQuiz();
  const pushedPopGuardRef = useRef(false);
  const allowNextPopRef = useRef(false);

  useEffect(() => {
    if (!hasActiveQuiz) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasActiveQuiz]);

  useEffect(() => {
    if (!hasActiveQuiz) return undefined;

    if (!pushedPopGuardRef.current) {
      window.history.pushState(
        { ...(window.history.state || {}), activeQuizGuard: true },
        '',
        window.location.href,
      );
      pushedPopGuardRef.current = true;
    }

    const handlePopState = () => {
      if (allowNextPopRef.current) {
        allowNextPopRef.current = false;
        pushedPopGuardRef.current = false;
        return;
      }

      if (window.confirm(activeQuizLeaveMessage)) {
        resetToGate();
        allowNextPopRef.current = true;
        window.history.back();
        return;
      }

      window.history.pushState(
        { ...(window.history.state || {}), activeQuizGuard: true },
        '',
        window.location.href,
      );
    };

    const handleDocumentClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const link = event.target.closest?.('a[href]');
      if (!link || link.target || link.hasAttribute('download')) return;
      if (link.dataset.activeQuizRestart === 'true') return;

      const nextUrl = new URL(link.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (nextUrl.pathname === window.location.pathname) return;

      if (!window.confirm(activeQuizLeaveMessage)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      resetToGate();
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [activeQuizLeaveMessage, hasActiveQuiz, resetToGate]);

  useEffect(() => {
    if (hasActiveQuiz) return;
    pushedPopGuardRef.current = false;
    allowNextPopRef.current = false;
  }, [hasActiveQuiz]);

  return null;
}

function App() {
  const location = useLocation();
  const { pathname } = location;
  const { user } = useAuth();
  const isAuthImmersive =
    pathname === '/login' || pathname === '/register' || pathname === '/bosscoming' || pathname === '/admin/login';
  const isGuestQuizGate = pathname === '/quiz' && !user;
  const hideAppShellHeader = isAuthImmersive || isGuestQuizGate;

  const appClass = [
    'app-layout',
    'app-layout--quiz-fullscreen',
    isAuthImmersive ? 'app-layout--auth-immersive' : '',
    isGuestQuizGate ? 'app-layout--quiz-guest-gate' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={appClass}>
      <ActiveQuizNavigationGuard />
      {!hideAppShellHeader ? (
        <header className="quiz-flow-scope app-layout__header gameplay-hud-stack">
          <AppShellNavbar />
          <div id="gameplay-hud-slot" className="gameplay-hud-slot" />
        </header>
      ) : null}

      <main className="app-layout__body">
        <div key={pathname} className={`motion-route-shell ${motionShellClass(pathname)}`}>
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/quiz" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/bosscoming" element={<Login adminMode />} />
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
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              <Route index element={<AdminPage />} />
              <Route path="questions" element={<Navigate to="/admin#admin-question-list" replace />} />
              <Route path="import" element={<Navigate to="/admin#admin-bulk-import" replace />} />
              <Route path="dashboard" element={<Navigate to="/admin" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/quiz" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
