// Subsystem A - Auth & Security (Tracy Cui): JWT secret lookup
// and token-signing configuration shared by auth controllers/middleware.

// Signing algorithm is pinned everywhere the secret is used so a token cannot be
// downgraded to "alg: none" or verified under an unexpected algorithm.
const JWT_ALGORITHM = 'HS256';

// Minimum entropy for a usable HMAC secret; also blocks the shipped placeholder.
const MIN_SECRET_LENGTH = 32;
const KNOWN_PLACEHOLDERS = new Set([
  'your_jwt_secret_here',
  'change_me',
  'changeme',
  'secret',
]);

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.trim().length > 0) {
    // Refuse to boot on a weak or well-known secret: a predictable key lets anyone
    // forge valid (including admin) tokens, so this is a hard fail, not a warning.
    if (KNOWN_PLACEHOLDERS.has(secret) || secret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET is weak or a known placeholder. Set a random value of at least ${MIN_SECRET_LENGTH} characters (e.g. \`openssl rand -hex 32\`).`
      );
    }
    return secret;
  }

  if (process.env.NODE_ENV === 'test') {
    return 'test-only-jwt-secret-value-at-least-32-chars';
  }

  throw new Error('JWT_SECRET environment variable is required');
}

module.exports = { getJwtSecret, JWT_ALGORITHM };
