import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  courseId:    { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount:      { type: Number, required: true },
  status:      { type: String, enum: ["pending","completed","refunded"], default: "pending" },
  txHash:      { type: String, default: "" },
  buyerAddress:{ type: String, default: "" },
  confirmedAt: { type: Date, default: null },
}, { timestamps: true });

purchaseSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("Purchase", purchaseSchema);
