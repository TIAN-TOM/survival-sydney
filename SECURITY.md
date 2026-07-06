# Security Policy

We take the security of this project seriously, especially given its use in exam-integrity and assessment contexts. This document explains how to report vulnerabilities and summarises the controls already implemented.

## Supported Versions

The project is pre-1.0 and moves quickly. Security fixes are applied to the `main` branch. Until a formal release cadence is established, please run the latest `main` (or the most recent tagged release) to receive fixes.

## Reporting a Vulnerability

Please report suspected vulnerabilities **privately**. Do not open a public issue for a security problem.

- Preferred: use GitHub's private vulnerability reporting (repository **Security** tab -> **Report a vulnerability**), if enabled.
- Otherwise, email: **security@REPLACE-ME.example** (replace with the project's real contact before publishing).

When reporting, please include:

- A description of the issue and its impact.
- Steps to reproduce or a proof of concept.
- Affected version, commit, or deployment mode (self-host vs SaaS).
- Any suggested remediation.

**Response targets (best effort):**

- Acknowledgement within 3 business days.
- Initial assessment within 10 business days.
- Coordinated disclosure once a fix is available. Please give us a reasonable window before any public disclosure.

We will credit reporters who wish to be acknowledged. Please act in good faith: no data exfiltration, no service degradation, and no accessing accounts or data that are not yours.

## Security Posture

The following controls are implemented in the current codebase. They are design intent as well as documentation; if you find a gap between this description and the code, that itself is worth reporting.

### Authentication and tokens

- **JWT secret hardening.** The backend refuses to boot if `JWT_SECRET` is missing, matches a known placeholder (for example `changeme`, `secret`), or is shorter than 32 characters. This is a hard startup failure, not a warning, so a predictable signing key cannot reach production.
- **Algorithm pinning (HS256).** Every place a token is verified pins `algorithms: ['HS256']`, which prevents `alg: none` downgrade and algorithm-confusion attacks.
- **Token-type separation.** Session login tokens and per-attempt quiz tokens are signed with the same key but carry a `purpose` claim. Session middleware rejects any token that carries a `purpose`, preventing an attempt token from being replayed as a login credential.
- **User revalidation per request.** The authenticated user is reloaded from the database on every request, so deleted accounts and role changes take effect immediately.

### Server-side scoring and signed attempt tokens

- **Server-side scoring.** Quiz scoring happens on the server. The client never receives correct answers before submission, and never computes its own score.
- **Signed attempt tokens.** When an attempt starts, the server issues a short-lived, signed token that binds one user to one exact question set and per-attempt option ordering. On submit, the token is verified for signature, expiry, `purpose`, matching user, unique question IDs, and valid option permutations. This blocks answer tampering, question substitution, and cross-user replay.

### Transport and request hardening

- **Helmet** sets security-related HTTP headers.
- **CORS** is restricted to the configured `CLIENT_ORIGIN` (no wildcard origin).
- **NoSQL injection protection** via `express-mongo-sanitize`, which strips `$` and `.` operators from user input.
- **Body size limit** of 1mb on JSON payloads.
- **API docs are disabled in production** (`NODE_ENV=production`) so the full schema surface is not exposed publicly.

### Rate limiting

- **Login and registration** are limited to 5 requests per minute per IP.
- **Quiz submission** is limited to 20 requests per minute, keyed by user ID (falling back to IP).
- **Proxy awareness.** `X-Forwarded-For` is only trusted when `TRUST_PROXY=true`, so clients cannot spoof their IP to bypass per-IP limits unless the deployment explicitly runs behind a trusted proxy (as the bundled Docker setup does).

### Passwords

- Passwords are hashed with bcrypt; the work factor is configurable via `BCRYPT_ROUNDS`.

## Self-Hosting Notes

- Always set a fresh, high-entropy `JWT_SECRET` (`openssl rand -hex 32`) per environment.
- Terminate TLS at your own reverse proxy or load balancer in front of the bundled nginx.
- Set `CLIENT_ORIGIN` to the exact public origin users visit.
- Do not expose MongoDB to untrusted networks; the provided compose file keeps it on the internal network by default.
