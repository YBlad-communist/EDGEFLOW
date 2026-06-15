import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    broadcastId: { type: mongoose.Schema.Types.ObjectId, ref: "Broadcast", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, default: "" },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

chatMessageSchema.index({ broadcastId: 1, createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
