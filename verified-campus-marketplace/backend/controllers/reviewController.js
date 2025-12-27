/**
 * Review Controller
 */

const { Review, Order } = require('../models');
const { success } = require('../utils/response');
const { asyncHandler, APIError } = require('../middleware');
const { analyzeReviewSentiment, summarizeProductReviews } = require('../services/ai');

// Create review
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, content, title, pros, cons } = req.body;

  // Verify purchase
  const order = await Order.findOne({
    customer: req.user._id,
    'items.product': productId,
  });
  const isVerifiedPurchase = !!order;

  // Analyze sentiment
  const ai = await analyzeReviewSentiment(content);

  const review = await Review.create({
    product: productId,
    reviewer: req.user._id,
    order: order?._id,
    rating,
    content,
    title,
    pros,
    cons,
    isVerifiedPurchase,
    aiAnalysis: ai,
  });

  return success(res, { review }, 'Review added', 201);
});

// Update review
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new APIError('Review not found', 404);
  if (review.reviewer.toString() !== req.user._id.toString()) throw new APIError('Not authorized', 403);

  ['rating', 'content', 'title', 'pros', 'cons'].forEach((f) => {
    if (req.body[f] !== undefined) review[f] = req.body[f];
  });

  if (req.body.content) {
    review.aiAnalysis = await analyzeReviewSentiment(req.body.content);
  }

  await review.save();
  return success(res, { review }, 'Review updated');
});

// List product reviews
const listProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, status: 'approved' })
    .populate('reviewer', 'name avatar')
    .sort({ createdAt: -1 });

  const summary = await summarizeProductReviews(reviews);
  return success(res, { reviews, summary });
});

module.exports = {
  createReview,
  updateReview,
  listProductReviews,
};
