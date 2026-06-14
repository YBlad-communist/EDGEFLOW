import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ["student", "author"], default: "student" },
  username:     { type: String, required: true, unique: true },
  displayName:  { type: String, default: "" },
  avatar:       { type: String, default: "" },
  bio:          { type: String, default: "" },
  balanceRub:   { type: Number, default: 0 },
  isAdmin:      { type: Boolean, default: false },
}, { timestamps: true });

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    email: this.email,
    role: this.role,
    username: this.username,
    displayName: this.displayName,
    avatar: this.avatar,
    bio: this.bio,
    balanceRub: this.balanceRub,
    isAdmin: this.isAdmin,
  };
};

export default mongoose.model("User", userSchema);
