const express = require('express');
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { uploadChatImage } = require('../config/cloudinary');

const router = express.Router();

router.get('/:swapId', protect, getMessages);
router.post('/:swapId', protect, uploadChatImage.single('image'), sendMessage);

module.exports = router;
