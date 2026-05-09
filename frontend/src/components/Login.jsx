import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext.jsx';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login({ adminMode = false }) {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      const target = adminMode ? '/admin' : (location.state?.from || '/');
      navigate(target, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed');
    }
  };

  const heading = adminMode ? 'Admin sign in' : 'Login';
  const submitLabel = adminMode ? 'Sign in as admin' : 'Sign in';
  const notice = location.state?.notice;
  const noticeTone = location.state?.noticeTone;

  return (
    <section className="auth-panel">
      <h2>{heading}</h2>
      {notice && (
        <p className={`auth-notice auth-notice--${noticeTone || 'info'}`} role="status">
          {notice}
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

        {serverError && (
          <p className="server-error" role="alert">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : submitLabel}
        </button>
      </form>
      {!adminMode && (
        <p>
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      )}
    </section>
  );
}
