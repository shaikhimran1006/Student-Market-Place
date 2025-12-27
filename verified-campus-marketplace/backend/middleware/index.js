/**
 * Middleware Index
 * Central export for all middleware
 */

const auth = require('./auth');
const { errorHandler, notFound, asyncHandler, APIError } = require('./errorHandler');
const validation = require('./validation');
const upload = require('./upload');

module.exports = {
  ...auth,
  errorHandler,
  notFound,
  asyncHandler,
  APIError,
  ...validation,
  ...upload,
};
