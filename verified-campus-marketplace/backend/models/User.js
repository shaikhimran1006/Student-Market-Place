/**
 * User Model
 * Handles user data with role-based access control
 * Roles: student, seller, admin
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
  },
  
  // Role & Verification
  role: {
    type: String,
    enum: ['student', 'seller', 'admin'],
    default: 'student',
  },
  isVerifiedStudent: {
    type: Boolean,
    default: false,
  },
  studentId: {
    type: String,
    trim: true,
  },
  college: {
    type: String,
    trim: true,
  },
  
  // Seller-specific fields
  sellerStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
  sellerApplication: {
    businessName: String,
    description: String,
    appliedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,
  },
  sellerRating: {
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
  },
  
  // Profile
  avatar: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA',
    },
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  banReason: String,
  
  // Timestamps
  lastLogin: Date,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance (avoid duplicating unique indexes declared on fields)
userSchema.index({ role: 1 });
userSchema.index({ sellerStatus: 1 });
userSchema.index({ college: 1 });
userSchema.index({ email: 1 }, { unique: true });

// Virtual for user's products (if seller)
userSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'seller',
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update passwordChangedAt if not new document
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email, 
      role: this.role,
      isVerifiedStudent: this.isVerifiedStudent,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Static method to find by email with password
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  if (user.isBanned) {
    throw new Error('Your account has been banned. Reason: ' + (user.banReason || 'Contact admin'));
  }
  
  if (!user.isActive) {
    throw new Error('Your account is deactivated');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }
  
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
