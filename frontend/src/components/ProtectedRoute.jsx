import { Navigate, Outlet } from 'react-router-dom';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

/** Player-only areas (history, leaderboard, etc.). Admin routes use ProtectedAdminRoute. */
export default function ProtectedRoute({ blockAdmin = false, children }) {
  const token = localStorage.getItem('jwt');
  const user = readStoredUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (blockAdmin && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children || <Outlet />;
}
