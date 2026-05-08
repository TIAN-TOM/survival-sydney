// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// global error-handler regression coverage.
const errorHandler = require('../middleware/errorHandler');

function mockResponse() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.headersSent = false;
  return res;
}

describe('errorHandler', () => {
  test('hides 5xx internals', () => {
    const err = new Error('database password leaked');
    err.status = 500;
    const res = mockResponse();

    errorHandler(err, { method: 'GET', originalUrl: '/x' }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  });

  test('returns client-safe 4xx message and details', () => {
    const err = new Error('Invalid request');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    err.details = [{ field: 'title' }];
    const res = mockResponse();

    errorHandler(err, { method: 'GET', originalUrl: '/x' }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid request',
      code: 'VALIDATION_ERROR',
      details: [{ field: 'title' }],
      statusCode: 400,
    });
  });
});
