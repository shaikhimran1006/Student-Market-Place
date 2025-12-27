/**
 * Cart Controller
 */

const { Cart, Product } = require('../models');
const { success } = require('../utils/response');
const { asyncHandler, APIError } = require('../middleware');

// Get cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.getOrCreateCart(req.user._id);
  return success(res, { cart });
});

// Add to cart
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') throw new APIError('Product not available', 404);

  const cart = await Cart.getOrCreateCart(req.user._id);
  await cart.addItem(productId, quantity, product.price);
  return success(res, { cart }, 'Added to cart');
});

// Update quantity
const updateQuantity = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await Cart.getOrCreateCart(req.user._id);
  await cart.updateItemQuantity(productId, quantity);
  return success(res, { cart }, 'Cart updated');
});

// Remove item
const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const cart = await Cart.getOrCreateCart(req.user._id);
  await cart.removeItem(productId);
  return success(res, { cart }, 'Item removed');
});

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeItem,
};
