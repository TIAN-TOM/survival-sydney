const express = require('express');
const { register, login, me } = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimiters');
const { validate, registerSchema, loginSchema } = require('../validators/auth.validators');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string, minLength: 3, maxLength: 30, pattern: '^[a-zA-Z0-9_-]+$' }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8, maxLength: 72 }
 *     responses:
 *       201: { description: 'Created, returns JWT and user' }
 *       400: { description: Validation error }
 *       409: { description: Username or email already taken }
 *       429: { description: Rate limit exceeded }
 */
router.post('/register', loginLimiter, validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user and return a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: 'OK, returns JWT and user' }
 *       400: { description: Validation error }
 *       401: { description: Invalid username or password }
 *       429: { description: Rate limit exceeded }
 */
router.post('/login', loginLimiter, validate(loginSchema), login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Return the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'OK, returns user' }
 *       401: { description: 'Missing or invalid token, or user no longer exists' }
 */
router.get('/me', auth, me);

module.exports = router;
