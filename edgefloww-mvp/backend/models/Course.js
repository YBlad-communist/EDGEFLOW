import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  videoPath:   { type: String, default: null },
  sortOrder:   { type: Number, default: 0 },
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  authorId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  priceUSDT:   { type: Number, required: true, min: 0 },
  cover:       { type: String, default: "" },
  category:    { type: String, default: "", index: true },
  lessons:     [lessonSchema],
}, { timestamps: true });

courseSchema.index({ title: "text", description: "text" });

export default mongoose.model("Course", courseSchema);
