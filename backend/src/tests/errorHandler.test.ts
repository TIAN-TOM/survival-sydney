// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// global error-handler regression coverage.
import { Request, Response } from 'express';
import errorHandler, { HttpError } from '../middleware/errorHandler';

function mockResponse() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    headersSent: false,
  };
  res.status.mockImplementation(() => res);
  res.json.mockImplementation(() => res);
  return res;
}

const asRequest = (req: object) => req as Request;
const asResponse = (res: object) => res as unknown as Response;

describe('errorHandler', () => {
  test('hides 5xx internals', () => {
    const err: HttpError = Object.assign(new Error('database password leaked'), { status: 500 });
    const res = mockResponse();

    errorHandler(err, asRequest({ method: 'GET', originalUrl: '/x' }), asResponse(res), jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
    });
  });

  test('returns client-safe 4xx message without diagnostic fields', () => {
    const err: HttpError = Object.assign(new Error('Invalid request'), {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: [{ field: 'title' }],
    });
    const res = mockResponse();

    errorHandler(err, asRequest({ method: 'GET', originalUrl: '/x' }), asResponse(res), jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid request',
    });
  });
});
