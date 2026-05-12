import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext.jsx';
import AuthScreenLayout from './AuthScreenLayout.jsx';

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
  const { register: registerUser } = useAuth();
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
      await registerUser({ username, email, password });
      navigate('/quiz', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed');
    }
  };

  return (
    <AuthScreenLayout>
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
        <h2>Register</h2>
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label>
            Username
            <input type="text" autoComplete="username" {...register('username')} />
            {errors.username && <span className="field-error">{errors.username.message}</span>}
          </label>

          <label>
            Email
            <input type="email" autoComplete="email" {...register('email')} />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </label>

          <label>
            Password
            <input type="password" autoComplete="new-password" {...register('password')} />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </label>

          <label>
            Confirm password
            <input type="password" autoComplete="new-password" {...register('confirmPassword')} />
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword.message}</span>
            )}
          </label>

          {serverError && (
            <p className="server-error" role="alert">
              {serverError}
            </p>
          )}

          <button type="submit" className="btn-wizard-start" disabled={isSubmitting}>
            <span className="btn-wizard-start__shine" aria-hidden="true" />
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p>
          Already have an account?{' '}
        <Link to="/quiz" state={{ openAuth: true }}>
          Log in
        </Link>
        </p>
      </section>
    </AuthScreenLayout>
  );
}
