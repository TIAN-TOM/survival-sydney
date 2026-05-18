import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * Route guard for all /admin* UI: guests and non-admin players cannot access
 * admin pages by typing URLs — assignment requires route protection, not only hidden nav links.
 */
export default function ProtectedAdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hasJwt = Boolean(localStorage.getItem('jwt'));

  if (!hasJwt) {
    return <Navigate to="/bosscoming" replace state={{ from: location.pathname }} />;
  }

  if (loading) {
    return (
      <div
        className="admin-route-auth-wait"
        role="status"
        aria-live="polite"
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '40vh',
          padding: '2rem',
          fontFamily: 'var(--font-ui, system-ui, sans-serif)',
          opacity: 0.85,
        }}
      >
        Verifying access…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/bosscoming" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/quiz" replace />;
  }

  return <Outlet />;
}
