/**
 * Validation Middleware
 * Uses express-validator for request validation
 */

const { validationResult, body, param, query } = require('express-validator');

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .matches(/\d/).withMessage('Password must contain a number'),
    body('studentId')
      .optional()
      .trim()
      .isLength({ min: 3 }).withMessage('Student ID must be at least 3 characters'),
    body('college')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('College name must be at least 2 characters'),
    validate,
  ],
  
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required'),
    validate,
  ],
  
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^[+]?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
    validate,
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
      .matches(/\d/).withMessage('New password must contain a number'),
    validate,
  ],
  
  sellerApplication: [
    body('businessName')
      .trim()
      .notEmpty().withMessage('Business name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Business name must be between 2 and 100 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Business description is required')
      .isLength({ min: 20, max: 500 }).withMessage('Description must be between 20 and 500 characters'),
    validate,
  ],
};

// Product validation rules
const productValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Product title is required')
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Product description is required')
      .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
    body('price')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category')
      .notEmpty().withMessage('Category is required')
      .isIn(['electronics', 'study-materials', 'event-passes', 'subscriptions'])
      .withMessage('Invalid category'),
    body('productType')
      .notEmpty().withMessage('Product type is required')
      .isIn(['physical', 'digital']).withMessage('Product type must be physical or digital'),
    body('stock')
      .optional()
      .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('condition')
      .optional()
      .isIn(['new', 'like-new', 'good', 'fair', 'poor']).withMessage('Invalid condition'),
    validate,
  ],
  
  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock')
      .optional()
      .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    validate,
  ],
  
  query: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('category')
      .optional()
      .isIn(['electronics', 'study-materials', 'event-passes', 'subscriptions'])
      .withMessage('Invalid category'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Minimum price must be non-negative'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Maximum price must be non-negative'),
    validate,
  ],
};

// Order validation rules
const orderValidation = {
  create: [
    body('items')
      .isArray({ min: 1 }).withMessage('Order must have at least one item'),
    body('items.*.product')
      .notEmpty().withMessage('Product ID is required for each item')
      .isMongoId().withMessage('Invalid product ID'),
    body('items.*.quantity')
      .notEmpty().withMessage('Quantity is required for each item')
      .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('paymentMethod')
      .notEmpty().withMessage('Payment method is required')
      .isIn(['card', 'paypal', 'campus-credits', 'cash-on-delivery'])
      .withMessage('Invalid payment method'),
    body('shippingAddress')
      .optional()
      .isObject().withMessage('Shipping address must be an object'),
    validate,
  ],
  
  updateStatus: [
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    validate,
  ],
};

// Review validation rules
const reviewValidation = {
  create: [
    body('rating')
      .notEmpty().withMessage('Rating is required')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('content')
      .trim()
      .notEmpty().withMessage('Review content is required')
      .isLength({ min: 10, max: 1000 }).withMessage('Review must be between 10 and 1000 characters'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('pros')
      .optional()
      .isArray().withMessage('Pros must be an array'),
    body('cons')
      .optional()
      .isArray().withMessage('Cons must be an array'),
    validate,
  ],
  
  update: [
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('content')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 }).withMessage('Review must be between 10 and 1000 characters'),
    validate,
  ],
};

// Common validators
const mongoIdParam = [
  param('id')
    .notEmpty().withMessage('ID is required')
    .isMongoId().withMessage('Invalid ID format'),
  validate,
];

module.exports = {
  validate,
  userValidation,
  productValidation,
  orderValidation,
  reviewValidation,
  mongoIdParam,
};
