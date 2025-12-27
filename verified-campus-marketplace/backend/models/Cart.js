/**
 * Cart Model
 * Handles shopping cart functionality
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const cartSchema = new mongoose.Schema({
  // Cart owner
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Cart items
  items: [cartItemSchema],
  
  // Totals (calculated)
  totals: {
    subtotal: {
      type: Number,
      default: 0,
    },
    itemCount: {
      type: Number,
      default: 0,
    },
  },
  
  // Saved for later
  savedItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Applied coupon
  coupon: {
    code: String,
    discount: Number,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
    },
  },
  
  // Last activity
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
cartSchema.index({ user: 1 }, { unique: true });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.totals.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  this.totals.itemCount = this.items.reduce((sum, item) => {
    return sum + item.quantity;
  }, 0);
  
  this.lastUpdated = new Date();
  
  next();
});

// Instance method to add item
cartSchema.methods.addItem = async function(productId, quantity, price) {
  const existingItem = this.items.find(
    item => item.product.toString() === productId.toString()
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = price; // Update to latest price
  } else {
    this.items.push({
      product: productId,
      quantity,
      price,
    });
  }
  
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const item = this.items.find(
    item => item.product.toString() === productId.toString()
  );
  
  if (!item) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    return this.removeItem(productId);
  }
  
  item.quantity = quantity;
  return this.save();
};

// Instance method to remove item
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(
    item => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.coupon = undefined;
  return this.save();
};

// Instance method to move item to saved
cartSchema.methods.saveForLater = async function(productId) {
  const itemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  const item = this.items[itemIndex];
  
  // Check if already saved
  const alreadySaved = this.savedItems.find(
    saved => saved.product.toString() === productId.toString()
  );
  
  if (!alreadySaved) {
    this.savedItems.push({ product: item.product });
  }
  
  // Remove from cart
  this.items.splice(itemIndex, 1);
  
  return this.save();
};

// Instance method to move saved item to cart
cartSchema.methods.moveToCart = async function(productId, price) {
  const savedIndex = this.savedItems.findIndex(
    saved => saved.product.toString() === productId.toString()
  );
  
  if (savedIndex === -1) {
    throw new Error('Item not found in saved items');
  }
  
  // Add to cart
  await this.addItem(productId, 1, price);
  
  // Remove from saved
  this.savedItems.splice(savedIndex, 1);
  
  return this.save();
};

// Static method to get or create cart for user
cartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'title price images stock status seller productType',
    populate: {
      path: 'seller',
      select: 'name sellerRating',
    },
  });
  
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }
  
  return cart;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
