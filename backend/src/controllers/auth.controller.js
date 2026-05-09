const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/auth');
const { ok, fail } = require('../utils/responseEnvelope');

const signToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );

exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const normalized = username.toLowerCase().trim();

    const existing = await User.findOne({ username: normalized });
    if (existing) {
      return res.status(409).json(fail('Username already taken', 409));
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ username: normalized, passwordHash });

    const token = signToken(user);
    return res.status(201).json(ok({ token, user: user.toSafeObject() }));
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json(fail('Invalid credentials', 401));
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json(fail('Invalid credentials', 401));
    }

    const token = signToken(user);
    return res.json(ok({ token, user: user.toSafeObject() }));
  } catch (err) {
    return next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json(fail('User not found', 404));
    }
    return res.json(ok({ user: user.toSafeObject() }));
  } catch (err) {
    return next(err);
  }
};
