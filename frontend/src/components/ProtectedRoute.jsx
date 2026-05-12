import { Navigate, Outlet, useLocation } from 'react-router-dom';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ adminOnly = false, children }) {
  const location = useLocation();
  const token = localStorage.getItem('jwt');
  const user = readStoredUser();

  if (!token) {
    return <Navigate to="/quiz" replace state={{ openAuth: true, from: location.pathname }} />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/quiz" replace />;
  }

  return children || <Outlet />;
}
