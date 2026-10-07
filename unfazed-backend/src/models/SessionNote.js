const mongoose = require('mongoose');

const soapSchema = new mongoose.Schema(
  {
    subjective: { type: String, default: '' },
    objective: { type: String, default: '' },
    assessment: { type: String, default: '' },
    plan: { type: String, default: '' },
  },
  { _id: false }
);

const dapSchema = new mongoose.Schema(
  {
    data: { type: String, default: '' },
    assessment: { type: String, default: '' },
    plan: { type: String, default: '' },
  },
  { _id: false }
);

const sessionNoteSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session ID reference is required'],
      index: true,
    },
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: [true, 'Therapist ID reference is required'],
      index: true,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['private', 'shared'],
      required: [true, 'Note privacy type is required (private or shared)'],
      default: 'private',
      index: true,
    },
    templateType: {
      type: String,
      enum: ['freeform', 'SOAP', 'DAP'],
      default: 'freeform',
    },
    content: {
      body: {
        type: String,
        default: '', // TipTap rich text / HTML / markdown
      },
      soap: {
        type: soapSchema,
        default: () => ({}),
      },
      dap: {
        type: dapSchema,
        default: () => ({}),
      },
    },
    signedByTherapist: {
      type: Boolean,
      default: false,
    },
    signedAt: {
      type: Date,
      default: null,
    },
    clientViewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for client portal isolation and therapist lookups
sessionNoteSchema.index({ client_id: 1, type: 1, createdAt: -1 });
sessionNoteSchema.index({ session_id: 1, type: 1 });
sessionNoteSchema.index({ therapist_id: 1, createdAt: -1 });

module.exports = mongoose.model('SessionNote', sessionNoteSchema);
