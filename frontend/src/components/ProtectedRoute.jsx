import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ adminOnly = false, children }) {
  const location = useLocation();
  const token = localStorage.getItem('jwt');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
}
