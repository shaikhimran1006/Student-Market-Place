/**
 * Order Model
 * Handles orders for both physical and digital products
 * Includes timeline-based tracking for physical products
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productSnapshot: {
    title: String,
    price: Number,
    image: String,
    productType: String,
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: true,
  },
  // For digital products
  digitalAccess: {
    isUnlocked: {
      type: Boolean,
      default: false,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    downloadLimit: Number,
    accessExpiresAt: Date,
    downloadLinks: [{
      url: String,
      generatedAt: Date,
      expiresAt: Date,
    }],
  },
});

const orderSchema = new mongoose.Schema({
  // Order Reference
  orderNumber: {
    type: String,
    required: true,
  },
  
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Order Items
  items: [orderItemSchema],
  
  // Pricing Summary
  pricing: {
    subtotal: {
      type: Number,
      required: true,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  
  // Shipping Address (for physical products)
  shippingAddress: {
    fullName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
  },
  
  // Order Status
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out-for-delivery',
      'delivered',
      'completed',
      'cancelled',
      'refunded',
    ],
    default: 'pending',
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['card', 'paypal', 'campus-credits', 'cash-on-delivery'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: String,
    paidAt: Date,
  },
  
  // Delivery Timeline (for physical products)
  timeline: [{
    status: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    location: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  
  // Shipping Details
  shipping: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String,
    method: {
      type: String,
      enum: ['standard', 'express', 'pickup'],
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    shippedAt: Date,
  },
  
  // Order Type
  orderType: {
    type: String,
    enum: ['physical', 'digital', 'mixed'],
    required: true,
  },
  
  // Notes
  customerNotes: String,
  sellerNotes: String,
  adminNotes: String,
  
  // Cancellation/Refund
  cancellation: {
    requestedAt: Date,
    reason: String,
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  
  refund: {
    requestedAt: Date,
    reason: String,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
    },
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web',
    },
  },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.product': 1 });
orderSchema.index({ 'items.productSnapshot.seller': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${year}${month}-${random}`;
  }
  next();
});

// Virtual for checking if order contains physical items
orderSchema.virtual('hasPhysicalItems').get(function() {
  return this.items.some(item => item.productSnapshot?.productType === 'physical');
});

// Virtual for checking if order contains digital items
orderSchema.virtual('hasDigitalItems').get(function() {
  return this.items.some(item => item.productSnapshot?.productType === 'digital');
});

// Instance method to add timeline event
orderSchema.methods.addTimelineEvent = function(status, title, description, location, updatedBy) {
  this.timeline.push({
    status,
    title,
    description,
    location,
    timestamp: new Date(),
    updatedBy,
  });
  return this.save();
};

// Instance method to unlock digital product
orderSchema.methods.unlockDigitalProduct = function(itemId) {
  const item = this.items.id(itemId);
  if (item && item.productSnapshot?.productType === 'digital') {
    item.digitalAccess.isUnlocked = true;
    return this.save();
  }
  throw new Error('Item not found or not a digital product');
};

// Static method to get order statistics
orderSchema.statics.getStats = async function(dateRange = {}) {
  const matchStage = {};
  
  if (dateRange.start && dateRange.end) {
    matchStage.createdAt = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end),
    };
  }
  
  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        avgOrderValue: { $avg: '$pricing.total' },
        statusBreakdown: {
          $push: '$status',
        },
      },
    },
  ]);
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
