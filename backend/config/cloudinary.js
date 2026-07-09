const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for listing images
const listingStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'swapwear/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }],
  },
});

// Storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'swapwear/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face', quality: 'auto' }],
  },
});

// Storage for chat images
const chatStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'swapwear/chat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const uploadListingImages = multer({
  storage: listingStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 4 * 1024 * 1024 },
});

const uploadChatImage = multer({
  storage: chatStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

module.exports = { cloudinary, uploadListingImages, uploadAvatar, uploadChatImage };
