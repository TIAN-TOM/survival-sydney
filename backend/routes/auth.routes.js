const express = require('express');
const { register, login, me } = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/me', auth, me);

module.exports = router;
