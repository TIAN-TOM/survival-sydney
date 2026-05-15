import { Link, useLocation } from 'react-router-dom';
import AuthPageShell from './AuthPageShell.jsx';
import { LoginFormPanel } from './LoginFormPanel.jsx';

export default function Login({ adminMode = false }) {
  const location = useLocation();
  const notice = location.state?.notice;
  const noticeTone = location.state?.noticeTone;
  const prefilledUsername = location.state?.registeredUsername || '';
  const backTo = adminMode ? '/' : '/quiz';

  return (
    <AuthPageShell>
      <Link className="auth-back-to-gate" to={backTo} replace>
        ← Back
      </Link>
      <LoginFormPanel
        adminMode={adminMode}
        heading={adminMode ? 'Administrator sign-in' : 'Sign in'}
        submitLabel="Sign in"
        notice={notice}
        noticeTone={noticeTone}
        prefilledUsername={prefilledUsername}
        showRegisterLink={!adminMode}
        resolveNavigatePath={() => {
          if (adminMode) return '/admin';
          const from = location.state?.from;
          if (typeof from === 'string' && from.startsWith('/') && from !== '/login' && from !== '/register') {
            return from;
          }
          return '/quiz';
        }}
      />
    </AuthPageShell>
  );
}
