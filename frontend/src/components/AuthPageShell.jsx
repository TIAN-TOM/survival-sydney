import AuthScreenLayout from './AuthScreenLayout.jsx';
import { AuthQuizCardShell } from './LoginFormPanel.jsx';

/**
 * Shared immersive shell for scholar/staff sign-in pages: one card system, same atmosphere as /register.
 */
export default function AuthPageShell({ children }) {
  return (
    <AuthScreenLayout>
      <AuthQuizCardShell tone="readable">{children}</AuthQuizCardShell>
    </AuthScreenLayout>
  );
}
