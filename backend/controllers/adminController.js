const User = require('../models/User');
const Listing = require('../models/Listing');
const SwapRequest = require('../models/SwapRequest');

// @desc    Platform statistics for admin dashboard
// @route   GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [userCount, listingCount, swapCount, completedSwaps, bannedUsers] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments({ status: { $ne: 'removed' } }),
      SwapRequest.countDocuments(),
      SwapRequest.countDocuments({ status: 'completed' }),
      User.countDocuments({ isBanned: true }),
    ]);

    const listingsByCategory = await Listing.aggregate([
      { $match: { status: { $ne: 'removed' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const swapsByStatus = await SwapRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const signupsOverTime = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        userCount,
        listingCount,
        swapCount,
        completedSwaps,
        bannedUsers,
        listingsByCategory,
        swapsByStatus,
        signupsOverTime,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    List all users (admin)
// @route   GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) {
      query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.json({ success: true, count: users.length, total, page: pageNum, users });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a user (admin)
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete an admin account' });
    }
    await user.deleteOne();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Ban / unban a user (admin)
// @route   PATCH /api/admin/users/:id/ban
const toggleBanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot ban an admin account' });
    }
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ success: true, message: user.isBanned ? 'User banned' : 'User unbanned', user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    List all listings (admin)
// @route   GET /api/admin/listings
const getAllListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [listings, total] = await Promise.all([
      Listing.find()
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Listing.countDocuments(),
    ]);

    res.json({ success: true, count: listings.length, total, page: pageNum, listings });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a listing (admin)
// @route   DELETE /api/admin/listings/:id
const deleteListingAdmin = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    await listing.deleteOne();
    res.json({ success: true, message: 'Listing removed by admin' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getAllUsers, deleteUser, toggleBanUser, getAllListings, deleteListingAdmin };
