const SwapRequest = require('../models/SwapRequest');
const Listing = require('../models/Listing');
const Notification = require('../models/Notification');

const notify = async (userId, type, text, link, io) => {
  const notification = await Notification.create({ user: userId, type, text, link });
  if (io) io.to(`user:${userId}`).emit('notification', notification);
};

// @desc    Create a swap request
// @route   POST /api/swaps
const createSwap = async (req, res, next) => {
  try {
    const { requestedListingId, offeredListingId, message } = req.body;

    const requestedListing = await Listing.findById(requestedListingId);
    if (!requestedListing || requestedListing.status !== 'available') {
      return res.status(400).json({ success: false, message: 'This listing is not available for swap' });
    }
    if (requestedListing.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot request a swap on your own listing' });
    }

    if (offeredListingId) {
      const offered = await Listing.findById(offeredListingId);
      if (!offered || offered.owner.toString() !== req.user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Invalid offered listing' });
      }
    }

    const swap = await SwapRequest.create({
      requester: req.user._id,
      recipient: requestedListing.owner,
      requestedListing: requestedListing._id,
      offeredListing: offeredListingId || null,
      message: message || '',
    });

    await notify(
      requestedListing.owner,
      'swap_request',
      `${req.user.name} requested a swap for "${requestedListing.title}"`,
      `/swaps/${swap._id}`,
      req.app.get('io')
    );

    const populated = await swap.populate([
      { path: 'requester', select: 'name avatar' },
      { path: 'recipient', select: 'name avatar' },
      { path: 'requestedListing' },
      { path: 'offeredListing' },
    ]);

    res.status(201).json({ success: true, message: 'Swap request sent', swap: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Get swaps for the logged in user (sent + received)
// @route   GET /api/swaps
const getSwaps = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    const query = {};

    if (role === 'sent') query.requester = req.user._id;
    else if (role === 'received') query.recipient = req.user._id;
    else query.$or = [{ requester: req.user._id }, { recipient: req.user._id }];

    if (status) query.status = status;

    const swaps = await SwapRequest.find(query)
      .populate('requester', 'name avatar')
      .populate('recipient', 'name avatar')
      .populate('requestedListing')
      .populate('offeredListing')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: swaps.length, swaps });
  } catch (err) {
    next(err);
  }
};

// @desc    Update swap status (accept / reject / complete / cancel)
// @route   PATCH /api/swaps/:id
const updateSwap = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['accepted', 'rejected', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const swap = await SwapRequest.findById(req.params.id).populate('requestedListing');
    if (!swap) {
      return res.status(404).json({ success: false, message: 'Swap request not found' });
    }

    const isRecipient = swap.recipient.toString() === req.user._id.toString();
    const isRequester = swap.requester.toString() === req.user._id.toString();

    if (!isRecipient && !isRequester) {
      return res.status(403).json({ success: false, message: 'Not authorized for this swap request' });
    }
    if ((status === 'accepted' || status === 'rejected') && !isRecipient) {
      return res.status(403).json({ success: false, message: 'Only the recipient can accept or reject' });
    }
    if (status === 'cancelled' && !isRequester) {
      return res.status(403).json({ success: false, message: 'Only the requester can cancel' });
    }

    swap.status = status;
    await swap.save();

    if (status === 'accepted') {
      await Listing.findByIdAndUpdate(swap.requestedListing._id, { status: 'pending' });
      if (swap.offeredListing) await Listing.findByIdAndUpdate(swap.offeredListing, { status: 'pending' });
    }
    if (status === 'completed') {
      await Listing.findByIdAndUpdate(swap.requestedListing._id, { status: 'swapped' });
      if (swap.offeredListing) await Listing.findByIdAndUpdate(swap.offeredListing, { status: 'swapped' });
      const User = require('../models/User');
      await User.findByIdAndUpdate(swap.requester, { $inc: { completedSwaps: 1 } });
      await User.findByIdAndUpdate(swap.recipient, { $inc: { completedSwaps: 1 } });
    }
    if (status === 'rejected' || status === 'cancelled') {
      await Listing.findByIdAndUpdate(swap.requestedListing._id, { status: 'available' });
      if (swap.offeredListing) await Listing.findByIdAndUpdate(swap.offeredListing, { status: 'available' });
    }

    const notifyUserId = isRecipient ? swap.requester : swap.recipient;
    await notify(
      notifyUserId,
      `swap_${status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : status === 'completed' ? 'completed' : 'system'}`,
      `Your swap request status changed to "${status}"`,
      `/swaps/${swap._id}`,
      req.app.get('io')
    );

    res.json({ success: true, message: `Swap request ${status}`, swap });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSwap, getSwaps, updateSwap };
