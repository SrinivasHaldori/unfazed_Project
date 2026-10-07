const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: [true, 'Therapist reference is required'],
      index: true,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required'],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Session start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'Session end time is required'],
      index: true,
    },
    duration: {
      type: Number,
      required: [true, 'Session duration in minutes is required'],
      enum: [30, 45, 50, 60, 90],
      default: 50,
    },
    status: {
      type: String,
      enum: ['booked', 'completed', 'cancelled', 'no-show'],
      default: 'booked',
      index: true,
    },
    meetingLink: {
      type: String,
      default: function () {
        return `https://meet.unfazed.in/room-${this._id}`;
      },
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// High-priority index for double-booking conflict resolution and scheduling range queries
sessionSchema.index({ therapist_id: 1, startTime: 1, endTime: 1, status: 1 });
sessionSchema.index({ client_id: 1, startTime: -1 });

module.exports = mongoose.model('Session', sessionSchema);
