const express = require('express');
const { getUserProfile, updateProfile, toggleWishlist, getWishlist } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');

const router = express.Router();

router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:listingId', protect, toggleWishlist);
router.patch('/profile', protect, uploadAvatar.single('avatar'), updateProfile);
router.get('/:id', getUserProfile);

module.exports = router;
