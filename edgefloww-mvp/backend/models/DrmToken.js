import mongoose from "mongoose";

const drmTokenSchema = new mongoose.Schema({
  lessonId:  { type: mongoose.Schema.Types.ObjectId, required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  token:     { type: String, required: true, unique: true, index: true },
  signature: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used:      { type: Boolean, default: false },
  ip:        { type: String, default: "" },
}, { timestamps: true });

drmTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("DrmToken", drmTokenSchema);
