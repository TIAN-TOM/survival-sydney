import { Link, useLocation } from 'react-router-dom';
import AuthPageShell from './AuthPageShell.tsx';
import { LoginFormPanel } from './LoginFormPanel.tsx';

export default function Login({ adminMode = false }: { adminMode?: boolean }) {
  const location = useLocation();
  // react-router types history state as `any`; pin it to the shape Register actually sends.
  const state = (location.state ?? null) as
    | { notice?: string; noticeTone?: string; registeredUsername?: string }
    | null;
  const notice = state?.notice;
  const noticeTone = state?.noticeTone;
  const prefilledUsername = state?.registeredUsername || '';
  const backTo = '/quiz';

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
        resolveNavigatePath={() => (adminMode ? '/admin' : '/quiz')}
      />
    </AuthPageShell>
  );
}
