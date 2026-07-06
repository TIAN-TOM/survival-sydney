// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// centralized error-to-envelope mapping for all backend routes.
import { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/responseEnvelope';

/** Errors raised by routes/middleware may carry an HTTP status hint. */
export interface HttpError extends Error {
  statusCode?: number;
  status?: number;
}

function resolveStatusCode(err: HttpError, res: Response): number {
  if (err.statusCode) {
    return err.statusCode;
  }

  if (err.status) {
    return err.status;
  }

  if (res.statusCode && res.statusCode >= 400) {
    return res.statusCode;
  }

  return 500;
}

function resolveClientMessage(err: HttpError, statusCode: number): string {
  if (statusCode >= 500) {
    return 'Internal server error';
  }

  return err.message || 'Request failed';
}

// The unused 4th parameter must stay: Express identifies error middleware by its 4-arg arity.
function errorHandler(err: HttpError, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = resolveStatusCode(err, res);
  const message = resolveClientMessage(err, statusCode);

  // Client sees a generic 5xx message, but the real error must be logged for diagnosis.
  // Stay quiet during tests to keep the suite output clean.
  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error(`[error] ${req.method} ${req.originalUrl || req.url}`, err);
  }

  res.status(statusCode).json(fail(message));
}

function notFound(req: Request, res: Response, next: NextFunction): void {
  const error: HttpError = new Error(`Route not found: ${req.originalUrl || req.url}`);
  error.statusCode = 404;
  next(error);
}

export default errorHandler;
export { errorHandler, notFound };
