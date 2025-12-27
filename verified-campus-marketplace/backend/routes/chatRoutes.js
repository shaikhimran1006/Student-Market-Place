/**
 * Chat Routes
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { optionalAuth } = require('../middleware');

router.post('/', optionalAuth, chatController.chat);

module.exports = router;
