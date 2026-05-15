import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext.jsx';
import AuthPageShell from './AuthPageShell.jsx';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, hyphen, and underscore'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export default function Register() {
  const { register: registerAccount, loading } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async ({ username, email, password }) => {
    setServerError('');
    try {
      await registerAccount({ username, email, password });
      navigate('/login', {
        replace: true,
        state: {
          notice: 'Your scholar account is ready. Sign in to enter the trials.',
          noticeTone: 'success',
          registeredUsername: username,
        },
      });
    } catch (err) {
      const status = err.status;
      if (status === 409) {
        setServerError(err.message || 'That username or email is already registered.');
        return;
      }
      if (status === 400) {
        setServerError(err.message || 'Please check the form and try again.');
        return;
      }
      setServerError(err.message || 'Registration failed');
    }
  };

  const busy = isSubmitting || loading;

  return (
    <AuthPageShell>
      <Link className="auth-back-to-gate" to="/quiz" replace>
        ← Back
      </Link>
      <h2>Register</h2>
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Username
          <input
            type="text"
            autoComplete="username"
            className={errors.username ? 'is-invalid' : undefined}
            aria-invalid={errors.username ? 'true' : undefined}
            {...register('username')}
          />
          {errors.username && <span className="field-error">{errors.username.message}</span>}
        </label>

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            className={errors.email ? 'is-invalid' : undefined}
            aria-invalid={errors.email ? 'true' : undefined}
            {...register('email')}
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            className={errors.password ? 'is-invalid' : undefined}
            aria-invalid={errors.password ? 'true' : undefined}
            {...register('password')}
          />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </label>

        <label>
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            className={errors.confirmPassword ? 'is-invalid' : undefined}
            aria-invalid={errors.confirmPassword ? 'true' : undefined}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <span className="field-error">{errors.confirmPassword.message}</span>
          )}
        </label>

        {serverError && (
          <p className="server-error" role="alert">
            {serverError}
          </p>
        )}

        <button type="submit" className="btn-wizard-start" disabled={busy}>
          <span className="btn-wizard-start__shine" aria-hidden="true" />
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthPageShell>
  );
}
