const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const therapistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Therapist full name is required'],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
      index: true,
    },
    password_hash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Hidden by default in queries
    },
    slug: {
      type: String,
      required: [true, 'Public slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Licensed Clinical Psychologist / Therapist',
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    specializations: {
      type: [String],
      default: ['Anxiety', 'Depression', 'Stress Management'],
    },
    languages: {
      type: [String],
      default: ['English', 'Hindi'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    subscriptionTier: {
      type: String,
      enum: ['free', 'pro', 'clinic'],
      default: 'free',
      index: true,
    },
    tierExpiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password if modified
therapistSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

// Compare password helper
therapistSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Transform output JSON to sanitize sensitive credentials
therapistSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Therapist', therapistSchema);
