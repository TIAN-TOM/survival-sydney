import { Link, useLocation } from 'react-router-dom';
import AuthScreenLayout from './AuthScreenLayout.jsx';
import { AuthQuizCardShell, LoginFormPanel } from './LoginFormPanel.jsx';

export default function Login({ adminMode = false }) {
  const location = useLocation();
  const notice = location.state?.notice;
  const noticeTone = location.state?.noticeTone;

  return (
    <AuthScreenLayout showBrand={!adminMode}>
      <AuthQuizCardShell>
        {adminMode ? (
          <Link
            className="auth-back-to-gate"
            to="/quiz"
            replace
          >
            ← Back
          </Link>
        ) : null}
        <LoginFormPanel
          adminMode={adminMode}
          heading={adminMode ? 'Admin sign in' : 'Login'}
          submitLabel={adminMode ? 'Sign in as admin' : 'Sign in'}
          notice={notice}
          noticeTone={noticeTone}
          resolveNavigatePath={() =>
            adminMode ? '/admin' : (location.state?.from || '/quiz')
          }
        />
      </AuthQuizCardShell>
    </AuthScreenLayout>
  );
}
