/**
 * File Upload Middleware
 * Handles file uploads with Multer and Firebase Storage
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadToFirebase } = require('../config/firebase');

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// File filter for digital products
const digitalProductFileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    // Videos
    'video/mp4',
    'video/mpeg',
    // Audio
    'audio/mpeg',
    'audio/wav',
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type for digital product.'), false);
  }
};

// Memory storage for processing before Firebase upload
const storage = multer.memoryStorage();

// Image upload configuration
const uploadImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Maximum 5 files
  },
});

// Digital product upload configuration
const uploadDigitalProduct = multer({
  storage,
  fileFilter: digitalProductFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for digital products
    files: 1,
  },
});

// Avatar upload configuration
const uploadAvatar = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for avatar
    files: 1,
  },
});

/**
 * Process uploaded images and upload to Firebase
 */
const processImageUploads = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }
    
    const uploadedImages = [];
    
    for (const file of req.files) {
      const fileName = `products/${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      
      try {
        const url = await uploadToFirebase(file.buffer, fileName, file.mimetype);
        uploadedImages.push({
          url,
          alt: file.originalname,
          fileName,
        });
      } catch (firebaseError) {
        console.error('Firebase upload error:', firebaseError);
        // For development, create a placeholder URL
        if (process.env.NODE_ENV === 'development') {
          uploadedImages.push({
            url: `https://via.placeholder.com/400x300?text=${encodeURIComponent(file.originalname)}`,
            alt: file.originalname,
            fileName: fileName,
          });
        } else {
          throw firebaseError;
        }
      }
    }
    
    req.uploadedImages = uploadedImages;
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message,
    });
  }
};

/**
 * Process avatar upload and upload to Firebase
 */
const processAvatarUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }
    
    const fileName = `avatars/${req.user._id}-${Date.now()}${path.extname(req.file.originalname)}`;
    
    try {
      const url = await uploadToFirebase(req.file.buffer, fileName, req.file.mimetype);
      req.avatarUrl = url;
    } catch (firebaseError) {
      console.error('Firebase upload error:', firebaseError);
      // For development, create a placeholder URL
      if (process.env.NODE_ENV === 'development') {
        req.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.name)}&background=random`;
      } else {
        throw firebaseError;
      }
    }
    
    next();
  } catch (error) {
    console.error('Avatar processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading avatar',
      error: error.message,
    });
  }
};

/**
 * Process digital product upload and upload to Firebase
 */
const processDigitalProductUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }
    
    const fileName = `digital-products/${uuidv4()}-${Date.now()}${path.extname(req.file.originalname)}`;
    
    try {
      const url = await uploadToFirebase(req.file.buffer, fileName, req.file.mimetype);
      req.digitalProductFile = {
        url,
        fileName,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        originalName: req.file.originalname,
      };
    } catch (firebaseError) {
      console.error('Firebase upload error:', firebaseError);
      throw firebaseError;
    }
    
    next();
  } catch (error) {
    console.error('Digital product processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading digital product',
      error: error.message,
    });
  }
};

// Error handler for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  
  next();
};

module.exports = {
  uploadImages,
  uploadDigitalProduct,
  uploadAvatar,
  processImageUploads,
  processAvatarUpload,
  processDigitalProductUpload,
  handleMulterError,
};
