const express = require('express');
const router = express.Router();

const { startQuiz, submitQuiz } = require('../controllers/quiz.controller');

router.get('/start', startQuiz);
router.post('/submit', submitQuiz);

module.exports = router;