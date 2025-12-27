/**
 * Product Controller
 */

const { Product } = require('../models');
const { success } = require('../utils/response');
const { asyncHandler, APIError } = require('../middleware');
const { verifyProduct } = require('../services/ai');

// Create product
const createProduct = asyncHandler(async (req, res) => {
  const data = req.body;

  // Attach seller
  data.seller = req.user._id;

  // Images from upload
  if (req.uploadedImages && req.uploadedImages.length > 0) {
    data.images = req.uploadedImages.map((img, idx) => ({
      url: img.url,
      alt: img.alt,
      isPrimary: idx === 0,
    }));
  }

  // Digital product file
  if (req.digitalProductFile) {
    data.productType = 'digital';
    data.digitalDetails = {
      fileUrl: req.digitalProductFile.url,
      fileType: req.digitalProductFile.fileType,
      fileSize: req.digitalProductFile.fileSize,
    };
  }

  const product = await Product.create(data);

  // AI verification
  const aiResult = await verifyProduct(product);
  product.aiAnalysis = aiResult;
  await product.save();

  return success(res, { product }, 'Product created', 201);
});

// List products with filters
const listProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, minPrice, maxPrice, search, sort = 'newest', featured } = req.query;
  const query = { status: 'active', isPublished: true };

  if (category) query.category = category;
  if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
  if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };
  if (search) query.$text = { $search: search };
  if (featured === 'true') query.isFeatured = true;

  const sortMap = {
    'price_asc': { price: 1 },
    'price_desc': { price: -1 },
    'rating': { 'ratings.average': -1, 'ratings.count': -1 },
    'trending': { 'stats.views': -1, createdAt: -1 },
    'newest': { createdAt: -1 },
  };
  const sortBy = sortMap[sort] || sortMap.newest;

  const products = await Product.find(query)
    .populate('seller', 'name sellerRating')
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);
  return success(res, { products, total, page: Number(page), limit: Number(limit) });
});

// List products for current seller
const listMyProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = { seller: req.user._id };
  if (status) query.status = status;

  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);
  return success(res, { products, total, page: Number(page), limit: Number(limit) });
});

// Get product by slug
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('seller', 'name sellerRating college')
    .populate({ path: 'reviews', match: { status: 'approved' } });

  if (!product) throw new APIError('Product not found', 404);
  return success(res, { product });
});

// Update product
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new APIError('Product not found', 404);

  // Only seller or admin
  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new APIError('Not authorized', 403);
  }

  const fields = ['title', 'description', 'price', 'stock', 'status', 'category', 'productType', 'condition'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });

  // Append new images
  if (req.uploadedImages && req.uploadedImages.length > 0) {
    const images = req.uploadedImages.map((img) => ({ url: img.url, alt: img.alt }));
    product.images = [...product.images, ...images];
  }

  await product.save();
  return success(res, { product }, 'Product updated');
});

// Delete product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new APIError('Product not found', 404);

  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new APIError('Not authorized', 403);
  }

  product.status = 'removed';
  await product.save();
  return success(res, { product }, 'Product removed');
});

// Compare products
const compareProducts = asyncHandler(async (req, res) => {
  const { ids = [] } = req.body;
  const products = await Product.find({ _id: { $in: ids } })
    .select('title price category productType ratings description images');
  return success(res, { products });
});

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  compareProducts,
  listMyProducts,
};
