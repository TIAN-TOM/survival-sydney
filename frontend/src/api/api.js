// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// shared Axios client, auth header injection, and envelope unwrapping.
import axios from 'axios';

const baseURL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5001/api';
const TOKEN_KEY = 'jwt';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getStoredToken() {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

// Session-expiry is broadcast so AuthContext can log the user out globally, instead of
// every page having to detect a 401 itself. Login/register 401s are credential errors, not
// expiry, so they are excluded.
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

function isCredentialEndpoint(url = '') {
  return url.includes('/auth/login') || url.includes('/auth/register');
}

function toEnvelopeError(error, fallbackMessage = 'Request failed') {
  const responseData = error.response?.data;
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
    responseData?.message ||
    transportMessage ||
    error.message ||
    fallbackMessage;

  const normalized = new Error(message);
  normalized.status = error.response?.status;
  normalized.response = error.response;
  normalized.originalError = error;

  return normalized;
}

function unwrapEnvelope(response) {
  const body = response.data;

  if (body && body.success === true) {
    return body.data;
  }

  if (body && body.success === false) {
    const error = new Error(
      (typeof body.error === 'string' ? body.error : undefined) ||
        body.message ||
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
  (response) => unwrapEnvelope(response),
  (error) => {
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

export { api, unwrapEnvelope, toEnvelopeError };
export default api;
