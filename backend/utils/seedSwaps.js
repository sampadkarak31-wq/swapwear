require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
const User = require('../models/User');
const Listing = require('../models/Listing');
const SwapRequest = require('../models/SwapRequest');
const Message = require('../models/Message');

const DEMO_SELLER_EMAILS = [
  'rohit.demo@swapwear.com',
  'priya.demo@swapwear.com',
  'arjun.demo@swapwear.com',
  'meera.demo@swapwear.com',
];

const SWAP_PLAN = [
  { from: 'rohit.demo@swapwear.com', to: 'priya.demo@swapwear.com', wantTitle: 'Silk Wrap Dress', offerTitle: 'Vintage Denim Jacket', status: 'pending', message: "Hi! Love this dress, would you swap for my denim jacket?" },
  { from: 'meera.demo@swapwear.com', to: 'arjun.demo@swapwear.com', wantTitle: 'Leather Sneakers', offerTitle: 'Yoga Set, Sage Green', status: 'pending', message: "These sneakers look barely worn, interested in a swap?" },
  { from: 'priya.demo@swapwear.com', to: 'meera.demo@swapwear.com', wantTitle: 'Running Tights', offerTitle: 'Floral Midi Sundress', status: 'pending', message: "Would you consider this dress for your running tights?" },
  { from: 'arjun.demo@swapwear.com', to: 'rohit.demo@swapwear.com', wantTitle: 'Wool Blend Overcoat', offerTitle: 'Running Shoes', status: 'accepted', message: "This overcoat is exactly what I've been looking for.", reply: "Sounds good, let's do it! When works for pickup?" },
  { from: 'meera.demo@swapwear.com', to: 'priya.demo@swapwear.com', wantTitle: 'Black Bodycon Evening Dress', offerTitle: 'Moisture-Wick Training Tee', status: 'accepted', message: "Would love to swap for this dress for an event I have coming up.", reply: "Happy to! Let's chat details." },
  { from: 'rohit.demo@swapwear.com', to: 'arjun.demo@swapwear.com', wantTitle: 'Structured Tote Bag', offerTitle: 'Quilted Puffer Vest', status: 'completed', message: "This tote would be perfect for work, interested in my puffer vest?", reply: "Deal! Really happy with the swap, thank you." },
  { from: 'priya.demo@swapwear.com', to: 'rohit.demo@swapwear.com', wantTitle: 'Oxford Cotton Button-Down', offerTitle: 'Silk Scarf Set', status: 'completed', message: "Would you swap this shirt for a set of silk scarves?", reply: "Absolutely, thanks for the smooth swap!" },
  { from: 'arjun.demo@swapwear.com', to: 'meera.demo@swapwear.com', wantTitle: 'Nehru Jacket, Navy', offerTitle: 'Canvas High-Tops', status: 'rejected', message: "Interested in swapping for this jacket.", reply: "Sorry, I've decided to keep this one for now." },
  { from: 'meera.demo@swapwear.com', to: 'rohit.demo@swapwear.com', wantTitle: 'Cropped Leather Jacket', offerTitle: 'Track Jacket, Retro', status: 'cancelled', message: "Would this track jacket work as a swap for your leather one?" },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB. Seeding demo swap requests...');

  const sellers = {};
  for (const email of DEMO_SELLER_EMAILS) {
    const user = await User.findOne({ email });
    if (!user) {
      console.error('Demo seller ' + email + ' not found -- run "npm run seed:listings" first.');
      await mongoose.disconnect();
      process.exit(1);
    }
    sellers[email] = user;
  }

  const existing = await SwapRequest.countDocuments({ requester: { $in: Object.values(sellers).map((s) => s._id) } });
  if (existing > 0) {
    console.log('Demo swap requests already exist (' + existing + ' found) -- skipping.');
    await mongoose.disconnect();
    process.exit(0);
  }

  let created = 0;
  let skipped = 0;

  for (const plan of SWAP_PLAN) {
    const requester = sellers[plan.from];
    const recipient = sellers[plan.to];

    const wantedListing = await Listing.findOne({ title: plan.wantTitle, owner: recipient._id });
    const offeredListing = plan.offerTitle ? await Listing.findOne({ title: plan.offerTitle, owner: requester._id }) : null;

    if (!wantedListing) {
      console.log('Skipping "' + plan.wantTitle + '" -- listing not found. Run "npm run seed:listings" first.');
      skipped++;
      continue;
    }

    const swap = await SwapRequest.create({
      requester: requester._id,
      recipient: recipient._id,
      requestedListing: wantedListing._id,
      offeredListing: offeredListing ? offeredListing._id : null,
      message: plan.message,
      status: plan.status,
    });

    if (plan.status === 'accepted') {
      await Listing.findByIdAndUpdate(wantedListing._id, { status: 'pending' });
      if (offeredListing) await Listing.findByIdAndUpdate(offeredListing._id, { status: 'pending' });
    }
    if (plan.status === 'completed') {
      await Listing.findByIdAndUpdate(wantedListing._id, { status: 'swapped' });
      if (offeredListing) await Listing.findByIdAndUpdate(offeredListing._id, { status: 'swapped' });
      await User.findByIdAndUpdate(requester._id, { $inc: { completedSwaps: 1 } });
      await User.findByIdAndUpdate(recipient._id, { $inc: { completedSwaps: 1 } });
    }

    if (plan.status !== 'pending') {
      await Message.create({ swap: swap._id, sender: requester._id, recipient: recipient._id, text: plan.message, seen: true, seenAt: new Date() });
      if (plan.reply) {
        await Message.create({ swap: swap._id, sender: recipient._id, recipient: requester._id, text: plan.reply, seen: true, seenAt: new Date() });
      }
    }

    created++;
  }

  console.log('Seeded ' + created + ' demo swap requests' + (skipped ? ' (' + skipped + ' skipped)' : '') + '.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});