const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String, // "HH:mm" in 24h format e.g. "10:00"
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid start time format (HH:mm)'],
    },
    endTime: {
      type: String, // "HH:mm" in 24h format e.g. "18:00"
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid end time format (HH:mm)'],
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const dayAvailabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      required: true,
      min: 0,
      max: 6,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    slots: {
      type: [timeSlotSchema],
      default: [],
    },
  },
  { _id: false }
);

const overrideSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: false, // If false, acts as blocked day / holiday
    },
    slots: {
      type: [timeSlotSchema],
      default: [],
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
      unique: true,
      index: true,
    },
    weeklyRecurringSlots: {
      type: [dayAvailabilitySchema],
      default: () => [
        { dayOfWeek: 1, isActive: true, slots: [{ startTime: '09:00', endTime: '17:00', isEnabled: true }] },
        { dayOfWeek: 2, isActive: true, slots: [{ startTime: '09:00', endTime: '17:00', isEnabled: true }] },
        { dayOfWeek: 3, isActive: true, slots: [{ startTime: '09:00', endTime: '17:00', isEnabled: true }] },
        { dayOfWeek: 4, isActive: true, slots: [{ startTime: '09:00', endTime: '17:00', isEnabled: true }] },
        { dayOfWeek: 5, isActive: true, slots: [{ startTime: '09:00', endTime: '17:00', isEnabled: true }] },
        { dayOfWeek: 6, isActive: false, slots: [] },
        { dayOfWeek: 0, isActive: false, slots: [] },
      ],
    },
    overrides: {
      type: [overrideSchema],
      default: [],
    },
    bufferTimeMinutes: {
      type: Number,
      default: 10,
      min: 0,
      max: 60,
    },
    slotDurations: {
      type: [Number],
      default: [30, 45, 50, 60],
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Availability', availabilitySchema);
