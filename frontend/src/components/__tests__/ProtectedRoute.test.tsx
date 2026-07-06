import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ProtectedRoute from '../ProtectedRoute.tsx';

interface MockAuthState {
  user: { username: string; role: string } | null;
  loading: boolean;
}

const authState = vi.hoisted(() => ({
  value: { user: null, loading: false } as MockAuthState,
}));

vi.mock('../../contexts/AuthContext.tsx', () => ({
  useAuth: () => authState.value,
}));

function renderProtectedRoute({
  user = null,
  token = null,
  blockAdmin = false,
}: { user?: MockAuthState['user']; token?: string | null; blockAdmin?: boolean } = {}) {
  authState.value = { user, loading: false };
  if (token) {
    localStorage.setItem('jwt', token);
  }

  return render(
    <MemoryRouter initialEntries={['/history']}>
      <Routes>
        <Route
          path="/history"
          element={(
            <ProtectedRoute blockAdmin={blockAdmin}>
              <div>Protected child</div>
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/admin" element={<div>Admin page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('redirects unauthenticated users to login', () => {
    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('redirects admin users away from player routes when blockAdmin is true', () => {
    renderProtectedRoute({
      token: 'jwt',
      user: { username: 'admin', role: 'admin' },
      blockAdmin: true,
    });

    expect(screen.getByText('Admin page')).toBeInTheDocument();
  });

  test('renders children for authenticated player users', () => {
    renderProtectedRoute({
      token: 'jwt',
      user: { username: 'player', role: 'user' },
      blockAdmin: true,
    });

    expect(screen.getByText('Protected child')).toBeInTheDocument();
  });
});
