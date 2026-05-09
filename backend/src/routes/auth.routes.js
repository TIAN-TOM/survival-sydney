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
 *             required: [username, password]
 *             properties:
 *               username: { type: string, minLength: 3, maxLength: 30 }
 *               password: { type: string, minLength: 6 }
 *               email: { type: string, format: email }
 *     responses:
 *       201: { description: Created, returns JWT and user }
 *       400: { description: Validation error }
 *       409: { description: Username already taken }
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
 *       200: { description: OK, returns JWT and user }
 *       400: { description: Missing fields }
 *       401: { description: Invalid credentials }
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
 *       200: { description: OK, returns user }
 *       401: { description: Missing or invalid token }
 *       404: { description: User no longer exists }
 */
router.get('/me', auth, me);

module.exports = router;
