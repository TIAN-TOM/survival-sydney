const { fail } = require('../utils/responseEnvelope');

module.exports = (err, req, res, next) => {
  console.error(`[errorHandler] ${req.method} ${req.path}`, err);

  const status = err.status || 500;
  const message = status >= 500 ? 'Internal server error' : err.message || 'Bad request';

  res.status(status).json(fail(message));
};
