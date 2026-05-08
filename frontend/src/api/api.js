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
    (typeof envelopeError === 'string' ? envelopeError : envelopeError?.message) ||
    responseData?.message ||
    error.message ||
    fallbackMessage;

  const normalized = new Error(message);
  normalized.status = error.response?.status || responseData?.statusCode;
  normalized.code = envelopeError?.code || responseData?.code;
  normalized.details = envelopeError?.details || responseData?.details;
  normalized.response = error.response;
  normalized.originalError = error;

  return normalized;
}

function unwrapEnvelope(response) {
  const body = response.data;

  if (body && (body.ok === true || body.success === true)) {
    return body.data;
  }

  if (body && (body.ok === false || body.success === false)) {
    const error = new Error(
      (typeof body.error === 'string' ? body.error : body.error?.message) ||
        body.message ||
        'Request failed'
    );
    error.status = response.status || body.statusCode;
    error.code = body.error?.code || body.code;
    error.details = body.error?.details || body.details;
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
