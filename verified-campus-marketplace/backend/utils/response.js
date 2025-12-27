/**
 * Response helpers
 */

const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const fail = (res, message = 'Request failed', statusCode = 400, errors = []) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

module.exports = { success, fail };
