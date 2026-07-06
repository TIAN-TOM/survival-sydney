import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { isApiError } from '../api/api.ts';
import { useAuth, type User } from '../contexts/AuthContext.tsx';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export function AuthQuizCardShell({ children, tone }: { children: ReactNode; tone?: 'readable' }) {
  const toneClass = tone === 'readable' ? ' auth-panel--readable' : '';
  return (
    <section className={`auth-panel q-card framed auth-panel--quizframe${toneClass}`}>
      <svg className="bracket tl" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="19,1 1,1 1,19" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
      </svg>
      <svg className="bracket tr" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="1,1 19,1 19,19" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
      </svg>
      <svg className="bracket bl" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="19,19 1,19 1,1" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
      </svg>
      <svg className="bracket br" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="1,19 19,19 19,1" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
      </svg>
      {children}
    </section>
  );
}

interface LoginFormPanelProps {
  adminMode?: boolean;
  heading: string;
  /** For aria-labelledby on dialog. */
  headingId?: string;
  submitLabel: string;
  notice?: string;
  noticeTone?: string;
  prefilledUsername?: string;
  /** Embedded flow: no router navigation. */
  onSuccess?: (user: User) => void;
  /** When onSuccess omitted, navigate here after login. */
  resolveNavigatePath?: () => string;
  showRegisterLink?: boolean;
}

export function LoginFormPanel({
  adminMode = false,
  heading,
  headingId,
  submitLabel,
  notice,
  noticeTone,
  prefilledUsername = '',
  onSuccess,
  resolveNavigatePath,
  showRegisterLink = true,
}: LoginFormPanelProps) {
  const navigate = useNavigate();
  const { login, logout, loading } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: prefilledUsername || '', password: '' },
  });

  useEffect(() => {
    reset({ username: prefilledUsername || '', password: '' });
  }, [prefilledUsername, reset]);

  const onSubmit = async ({ username, password }: z.infer<typeof loginSchema>) => {
    setServerError('');
    try {
      const signedInUser = await login(username, password);
      if (adminMode && signedInUser.role !== 'admin') {
        logout();
        setServerError('This account is not an administrator.');
        return;
      }
      if (!adminMode && signedInUser.role === 'admin') {
        logout();
        setServerError('Administrators must use the admin sign-in page.');
        return;
      }
      if (typeof onSuccess === 'function') {
        onSuccess(signedInUser);
        return;
      }
      const path = typeof resolveNavigatePath === 'function' ? resolveNavigatePath() : '/quiz';
      navigate(path, { replace: true });
    } catch (err) {
      const status = isApiError(err) ? err.status : undefined;
      if (status === 401) {
        setServerError('Incorrect username or password.');
        return;
      }
      setServerError((err instanceof Error && err.message) || 'Login failed');
    }
  };

  const busy = isSubmitting || loading;

  return (
    <>
      <h2 id={headingId}>{heading}</h2>
      {notice ? (
        <p className={`auth-notice auth-notice--${noticeTone || 'info'}`} role="status">
          {notice}
        </p>
      ) : null}
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Username
          <input
            type="text"
            autoComplete="username"
            className={errors.username ? 'is-invalid' : undefined}
            aria-invalid={errors.username ? 'true' : undefined}
            aria-describedby={errors.username ? 'login-username-err' : undefined}
            {...register('username')}
          />
          {errors.username ? (
            <span className="field-error" id="login-username-err" role="alert">
              {errors.username.message}
            </span>
          ) : null}
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            className={errors.password ? 'is-invalid' : undefined}
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby={errors.password ? 'login-password-err' : undefined}
            {...register('password')}
          />
          {errors.password ? (
            <span className="field-error" id="login-password-err" role="alert">
              {errors.password.message}
            </span>
          ) : null}
        </label>

        {serverError ? (
          <p className="server-error" role="alert">
            {serverError}
          </p>
        ) : null}

        <button type="submit" className="btn-wizard-start" disabled={busy}>
          <span className="btn-wizard-start__shine" aria-hidden="true" />
          {busy ? 'Signing in…' : submitLabel}
        </button>
      </form>
      {showRegisterLink && !adminMode ? (
        <p>
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      ) : null}
    </>
  );
}
