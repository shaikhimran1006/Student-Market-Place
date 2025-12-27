/**
 * Review Model
 * Handles product and seller reviews with AI sentiment analysis
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Product being reviewed
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  
  // Reviewer (customer who purchased)
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Order reference (to verify purchase)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  
  // Rating
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  
  // Review Content
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  content: {
    type: String,
    required: [true, 'Review content is required'],
    minlength: [10, 'Review must be at least 10 characters'],
    maxlength: [1000, 'Review cannot exceed 1000 characters'],
  },
  
  // Pros and Cons
  pros: [{
    type: String,
    trim: true,
  }],
  cons: [{
    type: String,
    trim: true,
  }],
  
  // Images
  images: [{
    url: String,
    caption: String,
  }],
  
  // AI Sentiment Analysis
  aiAnalysis: {
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'mixed'],
    },
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
    },
    summary: String,
    extractedPros: [String],
    extractedCons: [String],
    isSpam: {
      type: Boolean,
      default: false,
    },
    spamScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    analyzedAt: Date,
  },
  
  // Helpfulness
  helpfulness: {
    helpful: {
      type: Number,
      default: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
    },
    voters: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      vote: {
        type: String,
        enum: ['helpful', 'not-helpful'],
      },
    }],
  },
  
  // Seller Response
  sellerResponse: {
    content: String,
    respondedAt: Date,
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved', // Auto-approve for now
  },
  
  // Verification
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
  },
  
  // Flags
  flags: [{
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'misleading', 'other'],
    },
    description: String,
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    flaggedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
reviewSchema.index({ product: 1, reviewer: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for helpfulness score
reviewSchema.virtual('helpfulnessScore').get(function() {
  const total = this.helpfulness.helpful + this.helpfulness.notHelpful;
  if (total === 0) return 0;
  return (this.helpfulness.helpful / total * 100).toFixed(1);
});

// Post-save middleware to update product rating
reviewSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.product);
  if (product) {
    await product.updateRating(this.rating);
  }
});

// Post-remove middleware to update product rating
reviewSchema.post('remove', async function() {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.product);
  if (product) {
    await product.updateRating();
  }
});

// Static method to get review summary for a product
reviewSchema.statics.getProductReviewSummary = async function(productId) {
  const result = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        distribution: {
          $push: '$rating',
        },
        sentiments: {
          $push: '$aiAnalysis.sentiment',
        },
      },
    },
  ]);
  
  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      sentimentBreakdown: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
    };
  }
  
  // Calculate distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  result[0].distribution.forEach(rating => {
    distribution[rating]++;
  });
  
  // Calculate sentiment breakdown
  const sentimentBreakdown = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  result[0].sentiments.forEach(sentiment => {
    if (sentiment && sentimentBreakdown[sentiment] !== undefined) {
      sentimentBreakdown[sentiment]++;
    }
  });
  
  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews,
    distribution,
    sentimentBreakdown,
  };
};

// Instance method to vote helpfulness
reviewSchema.methods.voteHelpfulness = async function(userId, isHelpful) {
  const existingVote = this.helpfulness.voters.find(
    v => v.user.toString() === userId.toString()
  );
  
  if (existingVote) {
    // Update existing vote
    const oldVote = existingVote.vote;
    if (oldVote === 'helpful') this.helpfulness.helpful--;
    else this.helpfulness.notHelpful--;
    
    existingVote.vote = isHelpful ? 'helpful' : 'not-helpful';
  } else {
    // New vote
    this.helpfulness.voters.push({
      user: userId,
      vote: isHelpful ? 'helpful' : 'not-helpful',
    });
  }
  
  if (isHelpful) this.helpfulness.helpful++;
  else this.helpfulness.notHelpful++;
  
  return this.save();
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
