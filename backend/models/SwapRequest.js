const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    offeredListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null },
    message: { type: String, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

swapRequestSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('status')) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
  next();
});

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
