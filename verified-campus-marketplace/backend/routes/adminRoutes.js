/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware');

router.use(protect, restrictTo('admin'));

router.post('/sellers/review', adminController.reviewSeller);
router.post('/products/flag', adminController.flagProduct);
router.get('/analytics', adminController.analytics);
router.get('/sellers/pending', adminController.pendingSellers);
router.get('/products/flagged', adminController.flaggedProducts);

module.exports = router;
