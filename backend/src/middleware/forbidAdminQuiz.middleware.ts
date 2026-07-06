import { RequestHandler } from 'express';
import { fail } from '../utils/responseEnvelope';

/** Admins manage questions only; quiz play / history / review APIs are for players. */
const forbidAdminQuiz: RequestHandler = function forbidAdminQuiz(req, res, next) {
  if (req.user?.role === 'admin') {
    return res.status(403).json(fail('Admins cannot take quizzes.'));
  }
  return next();
};

export default forbidAdminQuiz;
