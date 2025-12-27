/**
 * Order Controller
 */

const { Order, Cart, Product } = require('../models');
const { success } = require('../utils/response');
const { asyncHandler, APIError } = require('../middleware');

// Create order from cart
const createOrder = asyncHandler(async (req, res) => {
  const { paymentMethod, shippingAddress } = req.body;

  const cart = await Cart.getOrCreateCart(req.user._id);
  if (!cart.items.length) throw new APIError('Cart is empty', 400);

  // Build order items snapshot
  const items = cart.items.map((item) => ({
    product: item.product._id,
    productSnapshot: {
      title: item.product.title,
      price: item.product.price,
      image: item.product.images?.[0]?.url,
      productType: item.product.productType,
      seller: item.product.seller,
    },
    quantity: item.quantity,
    price: item.product.price,
    digitalAccess: item.product.productType === 'digital' ? { downloadLimit: item.product.digitalDetails?.downloadLimit || -1 } : undefined,
  }));

  const subtotal = cart.totals.subtotal;
  const shipping = items.some((i) => i.productSnapshot.productType === 'physical') ? 5 : 0;
  const tax = Math.round(subtotal * 0.07 * 100) / 100;
  const total = subtotal + shipping + tax;

  const orderType = items.every((i) => i.productSnapshot.productType === 'digital')
    ? 'digital'
    : items.every((i) => i.productSnapshot.productType === 'physical')
      ? 'physical'
      : 'mixed';

  const order = await Order.create({
    customer: req.user._id,
    items,
    pricing: { subtotal, shipping, tax, discount: 0, total },
    payment: { method: paymentMethod, status: 'completed', paidAt: new Date() },
    shippingAddress,
    orderType,
    status: 'confirmed',
    timeline: [{ status: 'confirmed', title: 'Order confirmed', timestamp: new Date(), description: 'Payment received' }],
  });

  // Deduct stock for physical products
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product && product.productType === 'physical') {
      product.stock = Math.max(0, product.stock - item.quantity);
      await product.save();
    }
  }

  // Clear cart
  await cart.clearCart();

  return success(res, { order }, 'Order placed', 201);
});

// Get my orders
const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  return success(res, { orders });
});

// Update order status (seller/admin)
const updateStatus = asyncHandler(async (req, res) => {
  const { status, timelineNote } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new APIError('Order not found', 404);

  order.status = status;
  order.timeline.push({ status, title: status, description: timelineNote, updatedBy: req.user._id });
  await order.save();

  return success(res, { order }, 'Order status updated');
});

// Unlock digital item
const unlockDigital = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) throw new APIError('Order not found', 404);

  await order.unlockDigitalProduct(itemId);
  return success(res, { order }, 'Digital item unlocked');
});

module.exports = {
  createOrder,
  myOrders,
  updateStatus,
  unlockDigital,
};
