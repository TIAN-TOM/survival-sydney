// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// centralized error-to-envelope mapping for all backend routes.
const { fail } = require('../utils/responseEnvelope');

function resolveStatusCode(err, res) {
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

function resolveClientMessage(err, statusCode) {
  if (statusCode >= 500) {
    return 'Internal server error';
  }

  return err.message || 'Request failed';
}

function errorHandler(err, req, res, next) {
  const statusCode = resolveStatusCode(err, res);
  const message = resolveClientMessage(err, statusCode);
  const details = statusCode >= 500 ? undefined : err.details;
  const code = statusCode >= 500 ? undefined : err.code;

  res.status(statusCode).json(fail(message, statusCode, details, code));
}

function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl || req.url}`);
  error.statusCode = 404;
  next(error);
}

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;
module.exports.notFound = notFound;
