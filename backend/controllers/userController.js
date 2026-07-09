const User = require('../models/User');
const Listing = require('../models/Listing');
const Review = require('../models/Review');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get public user profile
// @route   GET /api/users/:id
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [listings, reviews] = await Promise.all([
      Listing.find({ owner: user._id, status: 'available' }).sort({ createdAt: -1 }),
      Review.find({ reviewee: user._id }).populate('reviewer', 'name avatar').sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({ success: true, user: user.toSafeObject(), listings, reviews });
  } catch (err) {
    next(err);
  }
};

// @desc    Update own profile
// @route   PATCH /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    ['name', 'bio', 'location'].forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    if (req.file) {
      if (user.avatar && user.avatar.publicId) {
        await cloudinary.uploader.destroy(user.avatar.publicId).catch(() => null);
      }
      user.avatar = { url: req.file.path, publicId: req.file.filename };
    }

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully', user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle wishlist item
// @route   POST /api/users/wishlist/:listingId
const Wishlist = require('../models/Wishlist');

const toggleWishlist = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const existing = await Wishlist.findOne({ user: req.user._id, listing: listingId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, message: 'Removed from wishlist', wishlisted: false });
    }

    await Wishlist.create({ user: req.user._id, listing: listingId });
    res.json({ success: true, message: 'Added to wishlist', wishlisted: true });
  } catch (err) {
    next(err);
  }
};

// @desc    Get own wishlist
// @route   GET /api/users/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.find({ user: req.user._id }).populate({
      path: 'listing',
      populate: { path: 'owner', select: 'name avatar' },
    });
    res.json({ success: true, wishlist: items.filter((i) => i.listing) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserProfile, updateProfile, toggleWishlist, getWishlist };
