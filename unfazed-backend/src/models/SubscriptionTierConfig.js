const mongoose = require('mongoose');

const subscriptionTierConfigSchema = new mongoose.Schema(
  {
    tierName: {
      type: String,
      enum: ['free', 'pro', 'clinic'],
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    caps: {
      activeClients: {
        type: Number,
        required: true,
        default: 5, // Free: 5, Pro: 50, Clinic: 999999
      },
    },
    featureFlags: {
      soapTemplates: {
        type: Boolean,
        default: false,
      },
      advancedAnalytics: {
        type: Boolean,
        default: false,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Fallback tier definition matrix if database tier records are not yet initialized
subscriptionTierConfigSchema.statics.DEFAULT_TIERS = {
  free: {
    tierName: 'free',
    displayName: 'Starter Solo Practice',
    description: 'Perfect for new therapists starting their independent practice.',
    caps: { activeClients: 5 },
    featureFlags: {
      soapTemplates: false,
      advancedAnalytics: false,
      customBranding: false,
      prioritySupport: false,
    },
  },
  pro: {
    tierName: 'pro',
    displayName: 'Thriving Practice',
    description: 'For established private practitioners scaling their client base.',
    caps: { activeClients: 50 },
    featureFlags: {
      soapTemplates: true,
      advancedAnalytics: true,
      customBranding: true,
      prioritySupport: true,
    },
  },
  clinic: {
    tierName: 'clinic',
    displayName: 'Clinic & Group Practice',
    description: 'For growing group practices and high-volume clinical centers.',
    caps: { activeClients: 999999 },
    featureFlags: {
      soapTemplates: true,
      advancedAnalytics: true,
      customBranding: true,
      prioritySupport: true,
    },
  },
};

module.exports = mongoose.model('SubscriptionTierConfig', subscriptionTierConfigSchema);
