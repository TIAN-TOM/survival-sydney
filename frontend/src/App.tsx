// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// application shell, route wiring, navigation, and cross-subsystem layout.
import { Suspense, lazy, useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShellNavbar from './components/AppShellNavbar.tsx';
import Login from './components/Login.tsx';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Register from './components/Register.tsx';
import { useAuth } from './contexts/AuthContext.tsx';
import { useQuiz } from './contexts/QuizContext.tsx';
import QuizPage from './pages/QuizPage.tsx';
import ReviewRouteRedirect from './components/ReviewRouteRedirect.tsx';

// Split non-landing routes out of the initial bundle. The admin console in particular
// (plus react-hook-form/zod forms) no longer ships to every player on first load.
const AdminPage = lazy(() => import('./pages/AdminPage.tsx'));
const HistoryPage = lazy(() => import('./pages/HistoryPage.tsx'));
const ReviewPage = lazy(() => import('./pages/ReviewPage.tsx'));
const Leaderboard = lazy(() => import('./components/Leaderboard.tsx'));

function motionShellClass(pathname: string): string {
  if (pathname.startsWith('/admin')) return 'motion-context--admin';
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

    // Browser refresh/close is the only exit path React Router cannot intercept directly.
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasActiveQuiz]);

  useEffect(() => {
    if (!hasActiveQuiz) return undefined;

    // Push a guard history entry so the browser Back button can ask for confirmation first.
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

    // Capture internal links before React Router navigates away from an active attempt.
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const link =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
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
  const { user, loading } = useAuth();
  const isAuthImmersive =
    pathname === '/login' || pathname === '/register' || pathname === '/admin/login';
  const isGuestQuizGate = pathname === '/quiz' && (loading || !user);
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
          <Suspense fallback={null}>
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/quiz" replace />} />
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
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              <Route index element={<AdminPage />} />
              <Route path="questions" element={<Navigate to="/admin#admin-question-list" replace />} />
              <Route path="import" element={<Navigate to="/admin#admin-bulk-import" replace />} />
              <Route path="dashboard" element={<Navigate to="/admin" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/quiz" replace />} />
          </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default App;
