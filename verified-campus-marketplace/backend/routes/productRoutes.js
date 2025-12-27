/**
 * Product Routes
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, requireApprovedSeller, productValidation, uploadImages, processImageUploads, uploadDigitalProduct, processDigitalProductUpload, optionalAuth } = require('../middleware');

router.get('/', productValidation.query, productController.listProducts);
router.get('/mine', protect, requireApprovedSeller, productController.listMyProducts);
router.get('/:slug', optionalAuth, productController.getProduct);
router.post('/', protect, requireApprovedSeller, uploadImages.array('images', 5), processImageUploads, uploadDigitalProduct.single('digitalFile'), processDigitalProductUpload, productValidation.create, productController.createProduct);
router.put('/:id', protect, requireApprovedSeller, uploadImages.array('images', 5), processImageUploads, productValidation.update, productController.updateProduct);
router.delete('/:id', protect, requireApprovedSeller, productController.deleteProduct);
router.post('/compare', productController.compareProducts);

module.exports = router;
