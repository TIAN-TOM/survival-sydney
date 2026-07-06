import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ProtectedAdminRoute from '../ProtectedAdminRoute.jsx';

const authState = vi.hoisted(() => ({
  value: { user: null, loading: false },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => authState.value,
}));

function renderProtectedAdminRoute({ user = null, token = null } = {}) {
  authState.value = { user, loading: false };
  if (token) {
    localStorage.setItem('jwt', token);
  }

  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<ProtectedAdminRoute />}>
          <Route index element={<div>Admin child</div>} />
        </Route>
        <Route path="/admin/login" element={<div>Admin login</div>} />
        <Route path="/quiz" element={<div>Quiz page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedAdminRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('redirects guests to the admin login', () => {
    renderProtectedAdminRoute();

    expect(screen.getByText('Admin login')).toBeInTheDocument();
  });

  test('redirects player users to quiz', () => {
    renderProtectedAdminRoute({
      token: 'jwt',
      user: { username: 'player', role: 'user' },
    });

    expect(screen.getByText('Quiz page')).toBeInTheDocument();
  });

  test('renders admin outlet for admin users', () => {
    renderProtectedAdminRoute({
      token: 'jwt',
      user: { username: 'admin', role: 'admin' },
    });

    expect(screen.getByText('Admin child')).toBeInTheDocument();
  });
});
