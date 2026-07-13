require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
const User = require('../models/User');
const Listing = require('../models/Listing');

// FIX: images are now generated per-item (unique "lock" id) instead of one
// shared URL per category. loremflickr.com returns a real keyword-matched
// photo per lock value, so every listing gets its own distinct, on-topic
// image instead of 4 items sharing (and sometimes mismatching) one photo.
const img = (keyword, lock) =>
  `https://loremflickr.com/900/900/${encodeURIComponent(keyword)}?lock=${lock}`;

const DEMO_SELLERS = [
  { name: 'Rohit Mehta', email: 'rohit.demo@swapwear.com', location: 'Mumbai' },
  { name: 'Priya Sen', email: 'priya.demo@swapwear.com', location: 'Bengaluru' },
  { name: 'Arjun Nair', email: 'arjun.demo@swapwear.com', location: 'Delhi' },
  { name: 'Meera Iyer', email: 'meera.demo@swapwear.com', location: 'Chennai' },
];

// 4 items per category x 8 categories = 32 listings
// `img(keyword, lock)` — lock must be unique across the whole list so no
// two listings ever end up with the same photo.
const LISTINGS = [
  // Tops
  { title: 'Oxford Cotton Button-Down', category: 'Tops', gender: 'Men', brand: 'Uniqlo', size: 'M', condition: 'Like new', img: img('dress-shirt', 1), value: 650, desc: 'Crisp white oxford shirt, worn twice for interviews. No stains or wear on the collar.' },
  { title: 'Ribbed Knit Turtleneck', category: 'Tops', gender: 'Women', brand: 'Zara', size: 'S', condition: 'Gently used', img: img('turtleneck', 2), value: 550, desc: 'Soft ribbed turtleneck in cream, great for layering through winter.' },
  { title: 'Oversized Graphic Tee', category: 'Tops', gender: 'Unisex', brand: 'H&M', size: 'L', condition: 'Well loved', img: img('graphic-tshirt', 3), value: 250, desc: 'Faded band tee, lots of character left in it. True oversized fit.' },
  { title: 'Silk Blouse, Emerald', category: 'Tops', gender: 'Women', brand: 'Fabindia', size: 'M', condition: 'New with tags', img: img('silk-blouse', 4), value: 1200, desc: 'Never worn, tags still attached. Bought for an event that got cancelled.' },

  // Dresses
  { title: 'Silk Wrap Dress', category: 'Dresses', gender: 'Women', brand: 'Zara', size: 'M', condition: 'Like new', img: img('wrap-dress', 5), value: 1400, desc: 'Worn once to a wedding. Dry cleaned and stored carefully since.' },
  { title: 'Floral Midi Sundress', category: 'Dresses', gender: 'Women', brand: 'H&M', size: 'S', condition: 'Gently used', img: img('floral-dress', 6), value: 700, desc: 'Perfect for summer brunches. Light cotton blend, breathable.' },
  { title: 'Black Bodycon Evening Dress', category: 'Dresses', gender: 'Women', brand: "Levi's", size: 'M', condition: 'Like new', img: img('evening-dress', 7), value: 1600, desc: 'Elegant and versatile — worn for one dinner party.' },
  { title: 'Boho Maxi Dress', category: 'Dresses', gender: 'Women', brand: 'Fabindia', size: 'L', condition: 'Well loved', img: img('maxi-dress', 8), value: 600, desc: 'Flowy printed maxi, been through a few festivals and still going strong.' },

  // Outerwear
  { title: 'Vintage Denim Jacket', category: 'Outerwear', gender: 'Unisex', brand: "Levi's", size: 'M', condition: 'Gently used', img: img('denim-jacket', 9), value: 1800, desc: 'Classic trucker jacket, broken in perfectly. A few authentic distressed patches.' },
  { title: 'Wool Blend Overcoat', category: 'Outerwear', gender: 'Men', brand: 'Zara', size: 'L', condition: 'Like new', img: img('wool-overcoat', 10), value: 2400, desc: 'Charcoal wool overcoat, worn one winter season. Dry cleaned, ready to go.' },
  { title: 'Cropped Leather Jacket', category: 'Outerwear', gender: 'Women', brand: 'H&M', size: 'S', condition: 'Gently used', img: img('leather-jacket', 11), value: 2100, desc: 'Faux leather, cropped fit. Zipper and lining in great shape.' },
  { title: 'Quilted Puffer Vest', category: 'Outerwear', gender: 'Unisex', brand: 'Uniqlo', size: 'M', condition: 'Like new', img: img('puffer-vest', 12), value: 900, desc: 'Lightweight and warm, barely worn — moving somewhere warmer.' },

  // Footwear
  { title: 'Leather Sneakers', category: 'Footwear', gender: 'Unisex', brand: 'Clarks', size: 'UK 8', condition: 'Gently used', img: img('leather-sneakers', 13), value: 1500, desc: 'Genuine leather, minor scuffing on the toe, otherwise great condition.' },
  { title: 'Running Shoes', category: 'Footwear', gender: 'Men', brand: 'Nike', size: 'UK 9', condition: 'Well loved', img: img('running-shoes', 14), value: 1100, desc: 'Good for another few hundred km. Cushioning still solid.' },
  { title: 'Block Heel Sandals', category: 'Footwear', gender: 'Women', brand: 'Zara', size: 'UK 6', condition: 'Like new', img: img('heel-sandals', 15), value: 900, desc: 'Worn indoors once to check the fit — turned out too small.' },
  { title: 'Canvas High-Tops', category: 'Footwear', gender: 'Unisex', brand: 'H&M', size: 'UK 7', condition: 'Gently used', img: img('canvas-sneakers', 16), value: 700, desc: 'Classic white canvas high-tops, freshly cleaned.' },

  // Accessories
  { title: 'Beaded Evening Clutch', category: 'Accessories', gender: 'Women', brand: 'Local artisan', size: 'One size', condition: 'Like new', img: img('clutch-bag', 17), value: 800, desc: 'Handmade beaded clutch, used once. Comes with the original dust bag.' },
  { title: 'Leather Belt, Tan', category: 'Accessories', gender: 'Men', brand: "Levi's", size: '32', condition: 'Gently used', img: img('leather-belt', 18), value: 450, desc: 'Genuine leather belt, classic buckle, ages well.' },
  { title: 'Silk Scarf Set', category: 'Accessories', gender: 'Women', brand: 'Fabindia', size: 'One size', condition: 'New with tags', img: img('silk-scarf', 19), value: 550, desc: 'Set of two printed silk scarves, never used, tags on.' },
  { title: 'Structured Tote Bag', category: 'Accessories', gender: 'Unisex', brand: 'Zara', size: 'One size', condition: 'Gently used', img: img('tote-bag', 20), value: 1300, desc: 'Roomy structured tote, great for work. Interior pocket intact.' },

  // Ethnic Wear
  { title: 'Handloom Cotton Kurta', category: 'Ethnic Wear', gender: 'Men', brand: 'Fabindia', size: 'L', condition: 'Like new', img: img('kurta', 21), value: 950, desc: 'Handwoven cotton kurta, worn once for a family function.' },
  { title: 'Embroidered Anarkali Suit', category: 'Ethnic Wear', gender: 'Women', brand: 'Local artisan', size: 'M', condition: 'Gently used', img: img('anarkali', 22), value: 2800, desc: 'Detailed thread embroidery, dry cleaned after each wear.' },
  { title: 'Banarasi Silk Dupatta', category: 'Ethnic Wear', gender: 'Women', brand: 'Local artisan', size: 'One size', condition: 'New with tags', img: img('saree', 23), value: 1600, desc: 'Authentic Banarasi weave, still has the shop tag.' },
  { title: 'Nehru Jacket, Navy', category: 'Ethnic Wear', gender: 'Men', brand: 'Fabindia', size: 'M', condition: 'Like new', img: img('nehru-jacket', 24), value: 1400, desc: 'Worn for one wedding season, professionally stored since.' },

  // Activewear
  { title: 'Running Tights', category: 'Activewear', gender: 'Women', brand: 'Nike', size: 'S', condition: 'Gently used', img: img('running-tights', 25), value: 600, desc: 'High-waisted, good compression, no pilling.' },
  { title: 'Moisture-Wick Training Tee', category: 'Activewear', gender: 'Men', brand: 'Nike', size: 'M', condition: 'Well loved', img: img('training-tee', 26), value: 350, desc: 'Been through a lot of gym sessions, still performs well.' },
  { title: 'Yoga Set, Sage Green', category: 'Activewear', gender: 'Women', brand: 'Uniqlo', size: 'S', condition: 'Like new', img: img('yoga-outfit', 27), value: 950, desc: 'Matching top and leggings, worn for one photoshoot only.' },
  { title: 'Track Jacket, Retro', category: 'Activewear', gender: 'Unisex', brand: 'H&M', size: 'L', condition: 'Gently used', img: img('track-jacket', 28), value: 700, desc: 'Retro stripe track jacket, lightweight, zips fully.' },

  // Bottoms
  { title: 'Slim Fit Jeans', category: 'Bottoms', gender: 'Men', brand: "Levi's", size: '32', condition: 'Gently used', img: img('slim-jeans', 29), value: 1100, desc: 'Classic 511 slim fit, no rips, medium wash.' },
  { title: 'Wide-Leg Trousers', category: 'Bottoms', gender: 'Women', brand: 'Zara', size: 'M', condition: 'Like new', img: img('trousers', 30), value: 900, desc: 'Flowy wide-leg trousers, worn twice to the office.' },
  { title: 'Cotton Chinos, Khaki', category: 'Bottoms', gender: 'Men', brand: 'Uniqlo', size: '32', condition: 'Gently used', img: img('chinos', 31), value: 700, desc: 'Versatile khaki chinos, machine washed, holding shape well.' },
  { title: 'High-Waisted Denim Shorts', category: 'Bottoms', gender: 'Women', brand: "Levi's", size: 'S', condition: 'Well loved', img: img('denim-shorts', 32), value: 500, desc: 'Well-loved summer staple, some natural fading, no damage.' },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB. Seeding demo listings...');

  const sellers = [];
  for (const seller of DEMO_SELLERS) {
    let user = await User.findOne({ email: seller.email });
    if (!user) {
      user = await User.create({
        name: seller.name,
        email: seller.email,
        password: 'DemoSeller123!',
        location: seller.location,
        isVerified: true,
        bio: 'Demo seller account — sample inventory for browsing.',
      });
      console.log(`Created demo seller: ${seller.email}`);
    }
    sellers.push(user);
  }

  const existingCount = await Listing.countDocuments({ owner: { $in: sellers.map((s) => s._id) } });
  if (existingCount > 0) {
    console.log(`Demo listings already exist (${existingCount} found) — skipping. Delete them first if you want to reseed.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const docs = LISTINGS.map((item, i) => ({
    owner: sellers[i % sellers.length]._id,
    title: item.title,
    description: item.desc,
    images: [{ url: item.img, publicId: `seed-${i}` }],
    category: item.category,
    gender: item.gender,
    brand: item.brand,
    size: item.size,
    condition: item.condition,
    tags: [item.category.toLowerCase(), item.brand.toLowerCase()],
    location: sellers[i % sellers.length].location,
    estimatedValue: item.value,
    status: 'available',
  }));

  await Listing.insertMany(docs);
  console.log(`Seeded ${docs.length} demo listings across ${new Set(LISTINGS.map((l) => l.category)).size} categories.`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});