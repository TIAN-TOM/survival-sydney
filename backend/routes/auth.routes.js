const express = require('express');
const { register, login, me } = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit');

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
 *     responses:
 *       201: { description: Created, returns JWT and user }
 *       400: { description: Validation error }
 *       409: { description: Username already taken }
 *       429: { description: Rate limit exceeded }
 */
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', auth, me);

module.exports = router;
