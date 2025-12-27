/**
 * Firebase Admin SDK Configuration
 * Handles Firebase Storage for image uploads
 */

const admin = require('firebase-admin');

let bucket = null;

const initializeFirebase = () => {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || (process.env.FIREBASE_PRIVATE_KEY || '').includes('YOUR_PRIVATE_KEY')) {
      console.warn('⚠️ Firebase disabled: configure FIREBASE_PROJECT_ID and FIREBASE_PRIVATE_KEY to enable uploads.');
      return null;
    }
    // Check if already initialized
    if (admin.apps.length > 0) {
      bucket = admin.storage().bucket();
      return bucket;
    }

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    bucket = admin.storage().bucket();
    console.log('✅ Firebase Admin initialized successfully');
    
    return bucket;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    // Return null - app can still work without Firebase for development
    return null;
  }
};

const getStorageBucket = () => {
  if (!bucket) {
    return initializeFirebase();
  }
  return bucket;
};

/**
 * Upload file to Firebase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Destination file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - Public URL of uploaded file
 */
const uploadToFirebase = async (fileBuffer, fileName, mimeType) => {
  const storageBucket = getStorageBucket();
  
  if (!storageBucket) {
    throw new Error('Firebase Storage not initialized');
  }

  const file = storageBucket.file(fileName);
  
  await file.save(fileBuffer, {
    metadata: {
      contentType: mimeType,
    },
    public: true,
  });

  // Get public URL
  const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
  
  return publicUrl;
};

/**
 * Delete file from Firebase Storage
 * @param {string} fileName - File name to delete
 */
const deleteFromFirebase = async (fileName) => {
  const storageBucket = getStorageBucket();
  
  if (!storageBucket) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    await storageBucket.file(fileName).delete();
  } catch (error) {
    console.error('Error deleting file from Firebase:', error.message);
  }
};

module.exports = {
  initializeFirebase,
  getStorageBucket,
  uploadToFirebase,
  deleteFromFirebase,
};
