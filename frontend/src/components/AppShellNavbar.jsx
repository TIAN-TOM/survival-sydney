import { useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext.jsx';
import AdminNavbar from './navbars/AdminNavbar.jsx';
import PlayerNavbar from './navbars/PlayerNavbar.jsx';
import PublicNavbar from './navbars/PublicNavbar.jsx';

/**
 * Route-first shell chrome: exactly one navbar implementation per area.
 * Guest /quiz gate: no shell header (theme is in QuizGateScreen); authenticated player uses PlayerNavbar.
 */
export default function AppShellNavbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  if (pathname === '/admin') {
    return <AdminNavbar />;
  }

  const isPlayerShell =
    pathname === '/quiz' ||
    pathname === '/history' ||
    pathname.startsWith('/history/') ||
    pathname === '/leaderboard';

  if (isPlayerShell) {
    return <PlayerNavbar />;
  }

  return <PublicNavbar />;
}
