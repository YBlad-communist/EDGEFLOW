const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  itemType: { type: String, enum: ['course', 'broadcast'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
  paymentId: { type: String, default: '' },
}, { timestamps: true });

purchaseSchema.index({ userId: 1, itemId: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
