/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, orderValidation, restrictTo } = require('../middleware');

router.post('/', protect, orderValidation.create, orderController.createOrder);
router.get('/me', protect, orderController.myOrders);
router.put('/:id/status', protect, restrictTo('seller', 'admin'), orderValidation.updateStatus, orderController.updateStatus);
router.post('/digital/unlock', protect, orderController.unlockDigital);

module.exports = router;
