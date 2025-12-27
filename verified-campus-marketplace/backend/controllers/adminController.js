/**
 * Admin Controller
 */

const { User, Product } = require('../models');
const { success } = require('../utils/response');
const { asyncHandler, APIError } = require('../middleware');

// Approve or reject seller
const reviewSeller = asyncHandler(async (req, res) => {
  const { sellerId, action, reason } = req.body;
  const seller = await User.findById(sellerId);
  if (!seller) throw new APIError('Seller not found', 404);

  seller.sellerStatus = action === 'approve' ? 'approved' : 'rejected';
  seller.sellerApplication = {
    ...seller.sellerApplication,
    reviewedAt: new Date(),
    reviewedBy: req.user._id,
    rejectionReason: action === 'reject' ? reason : undefined,
  };
  if (action === 'approve') seller.role = 'seller';
  await seller.save();

  return success(res, { seller }, `Seller ${action}d`);
});

// Flag product
const flagProduct = asyncHandler(async (req, res) => {
  const { productId, reason } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new APIError('Product not found', 404);

  product.status = 'flagged';
  product.aiAnalysis = {
    ...product.aiAnalysis,
    isFlagged: true,
    flagReason: reason,
    lastAnalyzedAt: new Date(),
  };
  await product.save();

  return success(res, { product }, 'Product flagged');
});

// Analytics summary
const analytics = asyncHandler(async (req, res) => {
  const [users, sellers, products, flagged] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'seller' }),
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({ 'aiAnalysis.isFlagged': true }),
  ]);

  return success(res, { metrics: { users, sellers, products, flagged } });
});

// Pending sellers list
const pendingSellers = asyncHandler(async (req, res) => {
  const pending = await User.find({ role: { $in: ['seller', 'student'] }, sellerStatus: 'pending' })
    .select('name email college sellerStatus sellerApplication createdAt');
  return success(res, { pending });
});

// Flagged products list
const flaggedProducts = asyncHandler(async (req, res) => {
  const flagged = await Product.find({ 'aiAnalysis.isFlagged': true })
    .select('title price category seller aiAnalysis status createdAt')
    .populate('seller', 'name email');
  return success(res, { flagged });
});

module.exports = {
  reviewSeller,
  flagProduct,
  analytics,
  pendingSellers,
  flaggedProducts,
};
