import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api, { SESSION_EXPIRED_EVENT } from '../api/api.ts';
import type { LoginResult, MeResult, RegisterResult, User } from '../types.ts';

export type { User };

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<RegisterResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'jwt';
const USER_KEY = 'user';

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const hasStoredToken = () => Boolean(localStorage.getItem(TOKEN_KEY));

const readStoredUser = (): User | null => {
  if (!hasStoredToken()) {
    localStorage.removeItem(USER_KEY);
    return null;
  }

  try {
    // Trusted own-origin cache of the last /auth/me payload; re-validated on mount below.
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null') as User | null;
  } catch {
    clearStoredAuth();
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [loading, setLoading] = useState<boolean>(hasStoredToken);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<LoginResult>('/auth/login', { username, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Creates account only — caller should redirect to login (no JWT stored). */
  const register = useCallback(async ({ username, email, password }: RegisterInput) => {
    setLoading(true);
    try {
      return await api.post<RegisterResult>('/auth/register', { username, email, password });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  // Any API 401 (expired/invalid token) broadcasts SESSION_EXPIRED_EVENT; clear auth here so
  // ProtectedRoute redirects to login instead of leaving a signed-in-looking zombie session.
  useEffect(() => {
    const handleSessionExpired = () => {
      if (hasStoredToken()) {
        clearStoredAuth();
      }
      setUser(null);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
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
      .get<MeResult>('/auth/me')
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

  const value = useMemo<AuthContextValue>(
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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
