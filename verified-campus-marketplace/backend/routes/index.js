/**
 * Routes Index
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

router.use('/auth', require('./authRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/products/:productId/reviews', require('./reviewRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/chat', require('./chatRoutes'));

module.exports = router;
