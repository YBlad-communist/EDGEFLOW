const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherProfileSchema = new mongoose.Schema({
  fullName: { type: String, default: '' },
  education: { type: String, default: '' },
  experience: { type: String, default: '' },
  specialization: { type: String, default: '' },
  hourlyRate: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  certificateUrls: [{ type: String }],
  isComplete: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: { type: String, required: true },
  username: { type: String, required: true, trim: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
  mode: { type: String, enum: ['learn_only', 'learn_and_teach'], default: 'learn_only' },
  balanceRub: { type: Number, default: 0 },
  teacherProfile: { type: teacherProfileSchema, default: () => ({}) },
}, { timestamps: true });

// Индексы
userSchema.index({ role: 1 });
userSchema.index({ email: 1 }, { unique: true });

// Хэширование пароля перед сохранением
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
