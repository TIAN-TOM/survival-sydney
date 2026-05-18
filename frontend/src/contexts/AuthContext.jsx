import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/api.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'jwt';
const USER_KEY = 'user';

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const hasStoredToken = () => Boolean(localStorage.getItem(TOKEN_KEY));

const readStoredUser = () => {
  if (!hasStoredToken()) {
    localStorage.removeItem(USER_KEY);
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    clearStoredAuth();
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(hasStoredToken);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { username, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Creates account only — caller should redirect to login (no JWT stored). */
  const register = useCallback(async ({ username, email, password }) => {
    setLoading(true);
    try {
      return await api.post('/auth/register', { username, email, password });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!hasStoredToken()) {
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    api
      .get('/auth/me')
      .then((data) => {
        if (cancelled) return;
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(() => {
        if (cancelled) return;
        clearStoredAuth();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user && hasStoredToken()),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
