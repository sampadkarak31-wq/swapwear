const Message = require('../models/Message');
const SwapRequest = require('../models/SwapRequest');

const ensureParticipant = async (swapId, userId) => {
  const swap = await SwapRequest.findById(swapId);
  if (!swap) return null;
  const isParticipant = [swap.requester.toString(), swap.recipient.toString()].includes(userId.toString());
  return isParticipant ? swap : null;
};

// @desc    Get chat history for a swap
// @route   GET /api/messages/:swapId
const getMessages = async (req, res, next) => {
  try {
    const swap = await ensureParticipant(req.params.swapId, req.user._id);
    if (!swap) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ swap: req.params.swapId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { swap: req.params.swapId, recipient: req.user._id, seen: false },
      { seen: true, seenAt: new Date() }
    );

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

// @desc    Send a message in a swap conversation (REST fallback; primary path is Socket.IO)
// @route   POST /api/messages/:swapId
const sendMessage = async (req, res, next) => {
  try {
    const swap = await ensureParticipant(req.params.swapId, req.user._id);
    if (!swap) {
      return res.status(403).json({ success: false, message: 'Not authorized to message in this conversation' });
    }

    const { text } = req.body;
    if (!text && !req.file) {
      return res.status(400).json({ success: false, message: 'Message text or image is required' });
    }

    const recipientId = swap.requester.toString() === req.user._id.toString() ? swap.recipient : swap.requester;

    const message = await Message.create({
      swap: swap._id,
      sender: req.user._id,
      recipient: recipientId,
      text: text || '',
      image: req.file ? { url: req.file.path, publicId: req.file.filename } : undefined,
    });

    const populated = await message.populate('sender', 'name avatar');

    const io = req.app.get('io');
    if (io) {
      io.to(`swap:${swap._id}`).emit('newMessage', populated);
    }

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMessages, sendMessage };
