import { NextFunction, Request, Response } from 'express';
import forbidAdminQuiz from '../middleware/forbidAdminQuiz.middleware';
import { fail } from '../utils/responseEnvelope';

const asRequest = (req: object) => req as Request;
const asResponse = (res: object) => res as unknown as Response;

describe('forbidAdminQuiz middleware', () => {
  test('calls next for non-admin users', () => {
    const req = { user: { id: 'u1', role: 'user' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next: NextFunction = jest.fn();
    forbidAdminQuiz(asRequest(req), asResponse(res), next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 403 for admin', () => {
    const req = { user: { id: 'a1', role: 'admin' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next: NextFunction = jest.fn();
    forbidAdminQuiz(asRequest(req), asResponse(res), next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(fail('Admins cannot take quizzes.'));
  });
});
