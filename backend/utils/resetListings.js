require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
const User = require('../models/User');
const Listing = require('../models/Listing');

const DEMO_SELLER_EMAILS = [
  'rohit.demo@swapwear.com',
  'priya.demo@swapwear.com',
  'arjun.demo@swapwear.com',
  'meera.demo@swapwear.com',
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB. Removing old demo listings...');

  const sellers = await User.find({ email: { $in: DEMO_SELLER_EMAILS } });
  const sellerIds = sellers.map((s) => s._id);

  const result = await Listing.deleteMany({ owner: { $in: sellerIds } });
  console.log(`Deleted ${result.deletedCount} old demo listings.`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});