const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  broadcastId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broadcast', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now },
});

chatMessageSchema.index({ broadcastId: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
