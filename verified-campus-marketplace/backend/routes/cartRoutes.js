/**
 * Cart Routes
 */

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware');

router.get('/', protect, cartController.getCart);
router.post('/add', protect, cartController.addToCart);
router.put('/update', protect, cartController.updateQuantity);
router.post('/remove', protect, cartController.removeItem);

module.exports = router;
