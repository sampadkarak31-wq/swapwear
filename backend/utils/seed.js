require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = (process.env.ADMIN_EMAIL || 'admin@swapwear.com').toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    await User.create({
      name: 'SwapWear Admin',
      email,
      password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
      role: 'admin',
      isVerified: true,
    });
    console.log(`Admin user created: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
