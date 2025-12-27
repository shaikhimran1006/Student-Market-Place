/**
 * Chat Controller - AI Assistant
 */

const { chatbot } = require('../services/ai');
const { success } = require('../utils/response');
const { asyncHandler } = require('../middleware');

const chat = asyncHandler(async (req, res) => {
  const { message, previousMessages = [] } = req.body;
  const response = await chatbot.processMessage(message, {
    userId: req.user?._id,
    previousMessages,
    userRole: req.user?.role,
  });

  return success(res, { response });
});

module.exports = { chat };
