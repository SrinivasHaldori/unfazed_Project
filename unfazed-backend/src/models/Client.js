const mongoose = require('mongoose');

const intakeDataSchema = new mongoose.Schema(
  {
    demographics: {
      dob: { type: Date },
      gender: { type: String, trim: true },
      occupation: { type: String, trim: true },
      emergencyContactName: { type: String, trim: true },
      emergencyContactPhone: { type: String, trim: true },
    },
    medicalHistory: {
      previousTherapy: { type: Boolean, default: false },
      currentMedications: { type: String, default: '' },
      psychiatricHistory: { type: String, default: '' },
    },
    presentingConcern: { type: String, default: '' },
    goals: { type: String, default: '' },
  },
  { _id: false }
);

const clientSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: [true, 'Therapist reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'Client email is required'],
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    intakeData: {
      type: intakeDataSchema,
      default: () => ({}),
    },
    consentGiven: {
      type: Boolean,
      default: false,
    },
    consentTimestamp: {
      type: Date,
      default: null,
    },
    consentIpAddress: {
      type: String,
      default: null,
    },
    consentTextVersion: {
      type: String,
      default: 'v1.0-india-telehealth',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-performance CRM querying
clientSchema.index({ therapist_id: 1, email: 1 });
clientSchema.index({ therapist_id: 1, status: 1 });
clientSchema.index({ therapist_id: 1, createdAt: -1 });

module.exports = mongoose.model('Client', clientSchema);
