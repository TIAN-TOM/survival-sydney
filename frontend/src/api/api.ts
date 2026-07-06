// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// shared Axios client, auth header injection, and envelope unwrapping.
import axios, { AxiosError, AxiosResponse, type AxiosRequestConfig } from 'axios';

import { ApiError } from './envelope.ts';

export { ApiError, isApiError } from './envelope.ts';
export type { ApiSuccess, ApiFailure, ApiEnvelope } from './envelope.ts';

const baseURL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5001/api';
const TOKEN_KEY = 'jwt';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getStoredToken(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

// Session-expiry is broadcast so AuthContext can log the user out globally, instead of
// every page having to detect a 401 itself. Login/register 401s are credential errors, not
// expiry, so they are excluded.
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

function isCredentialEndpoint(url = ''): boolean {
  return url.includes('/auth/login') || url.includes('/auth/register');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toEnvelopeError(error: AxiosError<unknown>, fallbackMessage = 'Request failed'): ApiError {
  const responseData = isRecord(error.response?.data) ? error.response.data : undefined;
  const envelopeError = responseData?.error;

  // No response means a transport failure; give the user something actionable instead of
  // leaking axios internals like "timeout of 10000ms exceeded".
  const transportMessage = !error.response
    ? error.code === 'ECONNABORTED'
      ? 'The request timed out. Please try again.'
      : 'Network error. Please check your connection and try again.'
    : undefined;

  const message =
    (typeof envelopeError === 'string' ? envelopeError : undefined) ||
    (typeof responseData?.message === 'string' ? responseData.message : undefined) ||
    transportMessage ||
    error.message ||
    fallbackMessage;

  const normalized = new ApiError(message);
  normalized.status = error.response?.status;
  normalized.response = error.response;
  normalized.originalError = error;

  return normalized;
}

function unwrapEnvelope(response: AxiosResponse<unknown>): unknown {
  const body = response.data;

  if (isRecord(body) && body.success === true) {
    return body.data;
  }

  if (isRecord(body) && body.success === false) {
    const error = new ApiError(
      (typeof body.error === 'string' ? body.error : undefined) ||
        (typeof body.message === 'string' ? body.message : undefined) ||
        'Request failed'
    );
    error.status = response.status;
    error.response = response;
    throw error;
  }

  return body;
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  // The interceptor deliberately resolves with the unwrapped envelope payload rather than
  // the AxiosResponse. Axios types cannot express that transformation, hence the assertion;
  // the typed facade below is what restores the real resolved type for callers.
  (response) => unwrapEnvelope(response) as unknown as AxiosResponse<unknown>,
  (error: AxiosError<unknown>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    // A 401 on any non-credential request means the stored token is no longer valid;
    // notify the app once so it can log out and redirect, rather than leaving a zombie session.
    if (status === 401 && !isCredentialEndpoint(requestUrl) && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(toEnvelopeError(error));
  },
);

/**
 * Typed facade over the Axios instance. Because the response interceptor unwraps the
 * envelope, every method resolves directly with the payload (`T`), not an AxiosResponse —
 * axios's second type parameter models exactly that.
 */
const typedApi = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get<unknown, T>(url, config),
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.post<unknown, T>(url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.put<unknown, T>(url, data, config),
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.patch<unknown, T>(url, data, config),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete<unknown, T>(url, config),
};

export { typedApi as api, unwrapEnvelope, toEnvelopeError };
export default typedApi;
