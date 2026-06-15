import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId },
    itemType: { type: String, enum: ["course", "broadcast", "topup"] },
    amount: { type: Number, required: true },
    yookassaPaymentId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "waiting_for_capture", "canceled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ yookassaPaymentId: 1 });

export default mongoose.model("Payment", paymentSchema);
