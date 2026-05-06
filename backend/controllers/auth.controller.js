const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ok, fail } = require('../utils/responseEnvelope');

const signToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );

exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json(fail('Username and password are required'));
    }
    if (password.length < 6) {
      return res.status(400).json(fail('Password must be at least 6 characters'));
    }

    const normalized = username.toLowerCase().trim();
    const existing = await User.findOne({ username: normalized });
    if (existing) {
      return res.status(409).json(fail('Username already taken'));
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
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json(fail('Username and password are required'));
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json(fail('Invalid credentials'));
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json(fail('Invalid credentials'));
    }

    const token = signToken(user);
    return res.json(ok({ token, user: user.toSafeObject() }));
  } catch (err) {
    return next(err);
  }
};
