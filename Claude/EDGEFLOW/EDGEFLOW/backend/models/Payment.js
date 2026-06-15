const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  itemType: { type: String, enum: ['course', 'broadcast'], required: true },
  amount: { type: Number, required: true },
  yookassaPaymentId: { type: String, unique: true, sparse: true },
  status: {
    type: String,
    enum: ['pending', 'waiting_for_capture', 'succeeded', 'canceled'],
    default: 'pending',
  },
  confirmationUrl: { type: String, default: '' },
}, { timestamps: true });

paymentSchema.index({ yookassaPaymentId: 1 });
paymentSchema.index({ userId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
