const express = require('express');
const {
  getStats,
  getAllUsers,
  deleteUser,
  toggleBanUser,
  getAllListings,
  deleteListingAdmin,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.use(protect, admin);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/ban', toggleBanUser);
router.get('/listings', getAllListings);
router.delete('/listings/:id', deleteListingAdmin);

module.exports = router;
