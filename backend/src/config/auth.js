// Subsystem A - Auth & Security (Tracy Cui): JWT secret lookup
// and token-signing configuration shared by auth controllers/middleware.
function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'test') {
    return 'test-only-jwt-secret';
  }

  throw new Error('JWT_SECRET environment variable is required');
}

module.exports = { getJwtSecret };
