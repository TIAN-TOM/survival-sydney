import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext.jsx';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export function AuthQuizCardShell({ children }) {
  return (
    <section className="auth-panel q-card framed auth-panel--quizframe">
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

/**
 * @param {object} props
 * @param {boolean} [props.adminMode]
 * @param {string} props.heading
 * @param {string} props.submitLabel
 * @param {string} [props.notice]
 * @param {string} [props.noticeTone]
 * @param {(user: object) => void} [props.onSuccess] — embedded flow: no router navigation
 * @param {() => string} [props.resolveNavigatePath] — when onSuccess omitted, navigate here after login
 * @param {boolean} [props.showRegisterLink]
 * @param {string} [props.headingId] — for aria-labelledby on dialog
 */
export function LoginFormPanel({
  adminMode = false,
  heading,
  headingId,
  submitLabel,
  notice,
  noticeTone,
  onSuccess,
  resolveNavigatePath,
  showRegisterLink = true,
}) {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async ({ username, password }) => {
    setServerError('');
    try {
      const signedInUser = await login(username, password);
      if (adminMode && signedInUser.role !== 'admin') {
        logout();
        setServerError('Admin access required');
        return;
      }
      if (typeof onSuccess === 'function') {
        onSuccess(signedInUser);
        return;
      }
      let path = typeof resolveNavigatePath === 'function' ? resolveNavigatePath() : '/quiz';
      if (!adminMode && signedInUser.role === 'admin') {
        path = '/admin';
      }
      navigate(path, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed');
    }
  };

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
          <input type="text" autoComplete="username" {...register('username')} />
          {errors.username && <span className="field-error">{errors.username.message}</span>}
        </label>

        <label>
          Password
          <input type="password" autoComplete="current-password" {...register('password')} />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </label>

        {serverError ? (
          <p className="server-error" role="alert">
            {serverError}
          </p>
        ) : null}

        <button type="submit" className="btn-wizard-start" disabled={isSubmitting}>
          <span className="btn-wizard-start__shine" aria-hidden="true" />
          {isSubmitting ? 'Signing in...' : submitLabel}
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
