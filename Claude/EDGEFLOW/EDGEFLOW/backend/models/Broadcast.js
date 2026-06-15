const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  price: { type: Number, default: 0 },
  isLive: { type: Boolean, default: false },
  streamKey: { type: String, unique: true, sparse: true },
  hlsUrl: { type: String, default: '' },
  startTime: { type: Date },
  endTime: { type: Date },
  recordedVideoUrl: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  tags: [{ type: String }],
  viewerCount: { type: Number, default: 0 },
}, { timestamps: true });

broadcastSchema.index({ authorId: 1 });
broadcastSchema.index({ isLive: 1 });
broadcastSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Broadcast', broadcastSchema);
