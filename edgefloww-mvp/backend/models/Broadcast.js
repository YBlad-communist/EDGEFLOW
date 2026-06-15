import mongoose from "mongoose";

const broadcastSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, default: 0 },
    category: { type: String, default: "live" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isLive: { type: Boolean, default: false },
    streamKey: { type: String, unique: true },
    rtmpUrl: { type: String },
    hlsUrl: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    recordedVideoUrl: { type: String },
  },
  { timestamps: true }
);

broadcastSchema.index({ authorId: 1 });
broadcastSchema.index({ isLive: 1 });

broadcastSchema.methods.toJSON = function () {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    price: this.price,
    category: this.category,
    authorId: this.authorId,
    isLive: this.isLive,
    streamKey: this.streamKey,
    rtmpUrl: this.rtmpUrl,
    hlsUrl: this.hlsUrl,
    startTime: this.startTime,
    endTime: this.endTime,
    recordedVideoUrl: this.recordedVideoUrl,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("Broadcast", broadcastSchema);
