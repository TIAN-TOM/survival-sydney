const { fail } = require('../utils/responseEnvelope');

module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json(fail('Admin access required'));
  }
  return next();
};
