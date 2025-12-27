/**
 * Token utilities
 */

const jwt = require('jsonwebtoken');

const signToken = (payload, expiresIn = process.env.JWT_EXPIRE || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const sendAuthToken = (user, res) => {
  const token = signToken({
    id: user._id,
    email: user.email,
    role: user.role,
    isVerifiedStudent: user.isVerifiedStudent,
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res.cookie('token', token, cookieOptions);
  return token;
};

module.exports = {
  signToken,
  sendAuthToken,
};
