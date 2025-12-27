/**
 * Product Model
 * Handles both physical and digital products
 * Categories: Electronics, Study Materials, Event Passes, Subscriptions
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters'],
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
  },
  currency: {
    type: String,
    default: 'USD',
  },
  
  // Category & Type
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['electronics', 'study-materials', 'event-passes', 'subscriptions'],
  },
  subcategory: {
    type: String,
    trim: true,
  },
  productType: {
    type: String,
    required: [true, 'Product type is required'],
    enum: ['physical', 'digital'],
  },
  
  // Digital Product Details
  digitalDetails: {
    fileUrl: String,
    fileType: String,
    fileSize: Number, // in bytes
    downloadLimit: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    accessDuration: {
      type: Number, // in days, -1 means lifetime
      default: -1,
    },
  },
  
  // Physical Product Details
  physicalDetails: {
    weight: Number, // in kg
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'express', 'pickup'],
      default: 'standard',
    },
  },
  
  // Inventory
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 1,
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
  },
  
  // Images
  images: [{
    url: {
      type: String,
      required: true,
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
  }],
  
  // Seller Information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required'],
  },
  
  // Condition (for physical products)
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    default: 'new',
  },
  
  // Tags for search
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  
  // Ratings & Reviews Summary
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
  },
  
  // AI Analysis
  aiAnalysis: {
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: String,
    suspicionScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    priceAnalysis: {
      isAbnormal: Boolean,
      marketAverage: Number,
      deviation: Number,
    },
    descriptionAnalysis: {
      isDuplicate: Boolean,
      similarProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      }],
      qualityScore: Number,
    },
    lastAnalyzedAt: Date,
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'inactive', 'sold', 'flagged', 'removed'],
    default: 'pending',
  },
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: String,
  }],
  
  // Visibility
  isPublished: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  
  // Statistics
  stats: {
    views: {
      type: Number,
      default: 0,
    },
    saves: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
  },
  
  // SEO
  slug: {
    type: String,
    unique: true,
  },
  metaTitle: String,
  metaDescription: String,
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'aiAnalysis.isFlagged': 1 });

// Virtual for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  }
  
  // Set short description if not provided
  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description.substring(0, 197) + '...';
  }
  
  next();
});

// Static method to get category stats
productSchema.statics.getCategoryStats = async function() {
  return await this.aggregate([
    { $match: { status: 'active', isPublished: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Instance method to update rating
productSchema.methods.updateRating = async function(newRating, oldRating = null) {
  const Review = mongoose.model('Review');
  
  // Recalculate from all reviews
  const stats = await Review.aggregate([
    { $match: { product: this._id } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);
  
  if (stats.length > 0) {
    this.ratings.average = Math.round(stats[0].avgRating * 10) / 10;
    this.ratings.count = stats[0].count;
  } else {
    this.ratings.average = 0;
    this.ratings.count = 0;
  }
  
  // Update distribution
  const distribution = await Review.aggregate([
    { $match: { product: this._id } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);
  
  this.ratings.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach(d => {
    this.ratings.distribution[d._id] = d.count;
  });
  
  await this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
