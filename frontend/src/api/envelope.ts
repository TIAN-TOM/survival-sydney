// Types for the backend's success/failure response envelope
// (backend/src/utils/responseEnvelope.js) and the normalised client-side error.
import type { AxiosResponse } from 'axios';

/** Success half of the backend response envelope. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/** Failure half of the backend response envelope. */
export interface ApiFailure {
  success: false;
  error: string;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/**
 * Normalised error every `api.*` call rejects with: envelope failures, HTTP errors,
 * and transport failures all surface as an ApiError with a user-facing message.
 */
export class ApiError extends Error {
  /** HTTP status code, when a response was received. */
  status?: number;
  /** Raw Axios response, when one was received. */
  response?: AxiosResponse<unknown>;
  /** Underlying Axios error, for debugging. */
  originalError?: unknown;
}

/** Narrow an unknown catch value to the ApiError raised by the shared client. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
