import { RequestHandler } from 'express';
import { fail } from '../utils/responseEnvelope';

const adminMiddleware: RequestHandler = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json(fail('Admin access required'));
  }
  return next();
};

export default adminMiddleware;
