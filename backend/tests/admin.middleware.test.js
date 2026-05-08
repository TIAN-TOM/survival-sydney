const adminOnly = require('../middleware/admin.middleware');

describe('admin middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('rejects with 403 when req.user is missing', () => {
    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.any(String) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects with 403 when user role is not admin', () => {
    req.user = { userId: 'abc123', role: 'user' };
    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next when user role is admin', () => {
    req.user = { userId: 'abc123', role: 'admin' };
    adminOnly(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
