import type { ReactNode } from 'react';

import AuthScreenLayout from './AuthScreenLayout.tsx';
import { AuthQuizCardShell } from './LoginFormPanel.tsx';

/**
 * Shared immersive shell for scholar/staff sign-in pages: one card system, same atmosphere as /register.
 */
export default function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <AuthScreenLayout>
      <AuthQuizCardShell tone="readable">{children}</AuthQuizCardShell>
    </AuthScreenLayout>
  );
}
