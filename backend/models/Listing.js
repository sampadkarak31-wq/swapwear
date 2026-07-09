const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 100 },
    description: { type: String, required: [true, 'Description is required'], maxlength: 2000 },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    category: {
      type: String,
      required: true,
      enum: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Footwear', 'Accessories', 'Ethnic Wear', 'Activewear'],
    },
    gender: { type: String, required: true, enum: ['Men', 'Women', 'Unisex', 'Kids'] },
    brand: { type: String, trim: true, default: 'Unbranded' },
    size: { type: String, required: true },
    condition: {
      type: String,
      required: true,
      enum: ['New with tags', 'Like new', 'Gently used', 'Well loved'],
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    location: { type: String, required: true },
    estimatedValue: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['available', 'pending', 'swapped', 'removed'], default: 'available' },
    views: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', description: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
