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
    const { username, email, password } = req.body;
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });
    if (existing) {
      const message = existing.username === normalizedUsername
        ? 'Username already taken'
        : 'Email already registered';
      return res.status(409).json(fail(message));
    }

    const user = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      role: 'user',
    });
    await user.setPassword(password);
    await user.save();

    return res.status(201).json(
      ok({
        user: user.toSafeObject(),
        message: 'Account created. Sign in to continue.',
      })
    );
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json(fail('Invalid username or password'));
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json(fail('Invalid username or password'));
    }

    const token = signToken(user);
    return res.json(ok({ token, user: user.toSafeObject() }));
  } catch (err) {
    return next(err);
  }
};

exports.me = (req, res) => {
  return res.json(ok({ user: req.user }));
};
