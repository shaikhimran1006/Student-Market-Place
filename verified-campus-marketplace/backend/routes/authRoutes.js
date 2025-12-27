/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, requireApprovedSeller, uploadAvatar, processAvatarUpload, userValidation } = require('../middleware');

router.post('/register', userValidation.register, authController.register);
router.post('/login', userValidation.login, authController.login);
router.get('/me', protect, authController.me);
router.put('/profile', protect, uploadAvatar.single('avatar'), processAvatarUpload, userValidation.updateProfile, authController.updateProfile);
router.put('/password', protect, userValidation.changePassword, authController.changePassword);
router.post('/seller/apply', protect, userValidation.sellerApplication, authController.applySeller);

module.exports = router;
