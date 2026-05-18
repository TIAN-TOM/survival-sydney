const { fail } = require('../utils/responseEnvelope');

/** Admins manage questions only; quiz play / history / review APIs are for players. */
module.exports = function forbidAdminQuiz(req, res, next) {
  if (req.user?.role === 'admin') {
    return res.status(403).json(fail('Admins cannot take quizzes.'));
  }
  return next();
};
