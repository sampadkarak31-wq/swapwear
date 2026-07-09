const express = require('express');
const {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
} = require('../controllers/listingController');
const { protect } = require('../middleware/auth');
const { uploadListingImages } = require('../config/cloudinary');

const router = express.Router();

router.get('/', getListings);
router.get('/:id', getListingById);
router.post('/', protect, uploadListingImages.array('images', 8), createListing);
router.put('/:id', protect, uploadListingImages.array('images', 8), updateListing);
router.delete('/:id', protect, deleteListing);

module.exports = router;
