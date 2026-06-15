import mongoose from "mongoose";

const teacherProfileSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: "" },
    education: { type: String, default: "" },
    experience: { type: Number, default: 0 },
    specialization: { type: String, default: "" },
    hourlyRate: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    certificateUrls: { type: [String], default: [] },
    isComplete: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher"], default: "student" },
    mode: { type: String, enum: ["learn_only", "learn_and_teach"], default: "learn_only" },
    username: { type: String, required: true },
    displayName: { type: String, default: "" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    balanceRub: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    teacherProfile: { type: teacherProfileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    email: this.email,
    role: this.role,
    mode: this.mode,
    username: this.username,
    displayName: this.displayName,
    avatar: this.avatar,
    bio: this.bio,
    balanceRub: this.balanceRub,
    isAdmin: this.isAdmin,
    teacherProfile: this.teacherProfile,
  };
};

export default mongoose.model("User", userSchema);
