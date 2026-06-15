import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    itemType: { type: String, enum: ["course", "broadcast"], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
    paymentId: { type: String },
  },
  { timestamps: true }
);

purchaseSchema.index({ userId: 1 });
purchaseSchema.index({ itemId: 1 });

export default mongoose.model("Purchase", purchaseSchema);
