const Question = require('../models/Question');
const Score = require('../models/Score');
const { success } = require('../utils/responseEnvelope');

/**
 * GET /api/quiz/start
 */
const startQuiz = async (req, res, next) => {
  try {
    const questions = await Question.aggregate([
      { $match: { active: true } },
      { $sample: { size: 10 } },
      {
        $project: {
          questionText: 1,
          options: 1,
          explanation: 1, 
        },
      },
    ]);

    return res.json(success(questions));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/quiz/submit
 */
const submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid answers format',
      });
    }

    let score = 0;
    const detailedAnswers = [];

    for (const ans of answers) {
      const question = await Question.findById(ans.questionId);

      if (!question) continue;

      const isCorrect =
        Number(ans.selectedAnswer) === Number(question.correctAnswer);

      if (isCorrect) score += 1;

      detailedAnswers.push({
        questionId: question._id,
        selectedAnswer: ans.selectedAnswer,
        isCorrect,
      });
    }

    const scoreRecord = await Score.create({
      userId: req.user.id, 
      score,
      answers: detailedAnswers,
    });

    return res.json(
      success({
        score,
        scoreId: scoreRecord._id,
        answers: detailedAnswers,
      })
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startQuiz,
  submitQuiz,
};