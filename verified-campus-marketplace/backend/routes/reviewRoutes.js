/**
 * Review Routes
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const { protect, reviewValidation } = require('../middleware');

router.post('/', protect, reviewValidation.create, reviewController.createReview);
router.put('/:id', protect, reviewValidation.update, reviewController.updateReview);
router.get('/', reviewController.listProductReviews);

module.exports = router;
