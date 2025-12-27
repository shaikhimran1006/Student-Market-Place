/**
 * Authentication Controller
 */

const { User } = require('../models');
const { sendAuthToken } = require('../utils/token');
const { success, fail } = require('../utils/response');
const { asyncHandler, APIError } = require('../middleware');

// Register new user
const register = asyncHandler(async (req, res) => {
  const { name, email, password, studentId, college } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new APIError('Email already registered', 400);

  const user = await User.create({
    name,
    email,
    password,
    studentId,
    college,
    isVerifiedStudent: !!studentId,
  });

  const token = sendAuthToken(user, res);
  return success(res, { user: sanitizeUser(user), token }, 'Registration successful', 201);
});

// Login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByCredentials(email, password);
    const token = sendAuthToken(user, res);
    return success(res, { user: sanitizeUser(user), token }, 'Login successful');
  } catch (err) {
    // normalize to 400 instead of 500
    throw new APIError(err.message || 'Invalid credentials', 400);
  }
});

// Current user
const me = asyncHandler(async (req, res) => {
  return success(res, { user: sanitizeUser(req.user) });
});

// Update profile
const updateProfile = asyncHandler(async (req, res) => {
  const updates = ['name', 'phone', 'college', 'address'];
  updates.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  if (req.avatarUrl) {
    req.user.avatar = req.avatarUrl;
  }

  await req.user.save();
  return success(res, { user: sanitizeUser(req.user) }, 'Profile updated');
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new APIError('Current password is incorrect', 400);

  user.password = newPassword;
  await user.save();

  const token = sendAuthToken(user, res);
  return success(res, { user: sanitizeUser(user), token }, 'Password updated');
});

// Seller application
const applySeller = asyncHandler(async (req, res) => {
  const { businessName, description } = req.body;

  req.user.role = 'seller';
  req.user.sellerStatus = 'pending';
  req.user.sellerApplication = {
    businessName,
    description,
    appliedAt: new Date(),
  };
  await req.user.save();

  return success(res, { user: sanitizeUser(req.user) }, 'Seller application submitted');
});

const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = {
  register,
  login,
  me,
  updateProfile,
  changePassword,
  applySeller,
};
