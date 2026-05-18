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

function toEnvelopeError(error, fallbackMessage = 'Request failed') {
  const responseData = error.response?.data;
  const envelopeError = responseData?.error;
  const message =
    (typeof envelopeError === 'string' ? envelopeError : undefined) ||
    responseData?.message ||
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
  (error) => Promise.reject(toEnvelopeError(error)),
);

export { api, unwrapEnvelope, toEnvelopeError };
export default api;
