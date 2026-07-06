import type { ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

/** Player-only areas (history, leaderboard, etc.). Admin routes use ProtectedAdminRoute. */
export default function ProtectedRoute({
  blockAdmin = false,
  children,
}: {
  blockAdmin?: boolean;
  children?: ReactElement;
}) {
  const token = localStorage.getItem('jwt');
  const { user, loading } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div
        className="player-route-auth-wait"
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
    return <Navigate to="/login" replace />;
  }

  if (blockAdmin && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children || <Outlet />;
}
