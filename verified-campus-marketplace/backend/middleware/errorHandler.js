/**
 * Error Handler Middleware
 * Centralized error handling for the API
 */

// Custom API Error class
class APIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle specific MongoDB errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new APIError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0] || 'duplicate value';
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new APIError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new APIError(message, 400);
};

const handleJWTError = () => {
  return new APIError('Invalid token. Please log in again.', 401);
};

const handleJWTExpiredError = () => {
  return new APIError('Your token has expired. Please log in again.', 401);
};

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }
  // Programming or other unknown error: don't leak details
  else {
    console.error('ERROR 💥:', err);
    
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong.',
    });
  }
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    // Handle specific error types
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    sendErrorProd(error, res);
  }
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new APIError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(error);
};

// Async handler wrapper to avoid try-catch blocks
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  APIError,
  errorHandler,
  notFound,
  asyncHandler,
};
