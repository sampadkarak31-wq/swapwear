const express = require('express');
const { createSwap, getSwaps, updateSwap } = require('../controllers/swapController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createSwap);
router.get('/', protect, getSwaps);
router.patch('/:id', protect, updateSwap);

module.exports = router;
