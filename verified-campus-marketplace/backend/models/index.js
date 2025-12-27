/**
 * Models Index
 * Central export for all database models
 */

const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const Review = require('./Review');
const Cart = require('./Cart');

module.exports = {
  User,
  Product,
  Order,
  Review,
  Cart,
};
