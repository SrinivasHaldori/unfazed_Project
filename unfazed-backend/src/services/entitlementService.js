const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');

/**
 * Entitlement Service: Centralized single-source-of-truth for all subscription tier gates.
 * No controller should ever execute inline tier checks.
 */
class EntitlementService {
  /**
   * Retrieves tier configuration for a given tier name.
   * Falls back to DEFAULT_TIERS if database config is not populated yet.
   */
  async getTierConfig(tierName) {
    const config = await SubscriptionTierConfig.findOne({ tierName }).lean();
    if (config) return config;

    return (
      SubscriptionTierConfig.DEFAULT_TIERS[tierName] ||
      SubscriptionTierConfig.DEFAULT_TIERS.free
    );
  }

  /**
   * Evaluates if a therapist can access a given feature or resource cap.
   *
   * @param {string|ObjectId} therapistId
   * @param {'active_clients_cap'|'soap_templates'|'advanced_analytics'} featureKey
   * @param {Object} context - Optional contextual data (e.g. proposed new client count)
   * @returns {Promise<{ allowed: boolean, reason?: string, currentUsage?: number, limit?: number, upgradePrompt?: Object }>}
   */
  async canAccess(therapistId, featureKey, context = {}) {
    const therapist = await Therapist.findById(therapistId).lean();
    if (!therapist) {
      return {
        allowed: false,
        reason: 'THERAPIST_NOT_FOUND',
        upgradePrompt: null,
      };
    }

    const tierName = therapist.subscriptionTier || 'free';
    const tierConfig = await this.getTierConfig(tierName);

    switch (featureKey) {
      case 'active_clients_cap': {
        const activeClientsCount = await Client.countDocuments({
          therapist_id: therapistId,
          status: 'active',
        });

        const limit = tierConfig.caps.activeClients;
        const proposedCount = (context.increment || 1) + activeClientsCount;

        if (activeClientsCount >= limit) {
          return {
            allowed: false,
            reason: 'CAP_EXCEEDED',
            currentUsage: activeClientsCount,
            limit,
            tier: tierName,
            upgradePrompt: {
              title: 'Active Client Cap Reached',
              message: `Your current ${tierConfig.displayName} plan is limited to ${limit} active clients. Upgrade to Pro to accept up to 50 active clients and unlock clinical templates.`,
              targetTier: 'pro',
              currentTier: tierName,
              actionText: 'Upgrade to Pro Plan',
            },
          };
        }

        return {
          allowed: true,
          currentUsage: activeClientsCount,
          limit,
          tier: tierName,
        };
      }

      case 'soap_templates': {
        const hasAccess = Boolean(tierConfig.featureFlags?.soapTemplates);

        if (!hasAccess) {
          return {
            allowed: false,
            reason: 'FEATURE_LOCKED',
            tier: tierName,
            upgradePrompt: {
              title: 'Clinical Templates (SOAP / DAP) Locked',
              message: `Standardized SOAP and DAP clinical documentation templates are available on Pro and Clinic tiers. Free tier includes flexible Freeform notes.`,
              targetTier: 'pro',
              currentTier: tierName,
              actionText: 'Unlock Clinical Templates',
            },
          };
        }

        return {
          allowed: true,
          tier: tierName,
        };
      }

      case 'advanced_analytics': {
        const hasAccess = Boolean(tierConfig.featureFlags?.advancedAnalytics);

        if (!hasAccess) {
          return {
            allowed: false,
            reason: 'FEATURE_LOCKED',
            tier: tierName,
            upgradePrompt: {
              title: 'Practice Analytics Locked',
              message: `Gain deep visibility into your practice with retention metrics, no-show rates, and longitudinal session volume analytics on the Pro plan.`,
              targetTier: 'pro',
              currentTier: tierName,
              actionText: 'Upgrade for Practice Analytics',
            },
          };
        }

        return {
          allowed: true,
          tier: tierName,
        };
      }

      default:
        return {
          allowed: false,
          reason: 'UNKNOWN_FEATURE_KEY',
          upgradePrompt: null,
        };
    }
  }

  /**
   * Returns a complete bundle of the therapist's current entitlements.
   * Consumed by frontend `useEntitlement` hook.
   */
  async getTherapistEntitlements(therapistId) {
    const therapist = await Therapist.findById(therapistId).lean();
    if (!therapist) return null;

    const tierName = therapist.subscriptionTier || 'free';
    const tierConfig = await this.getTierConfig(tierName);

    const activeClientsCount = await Client.countDocuments({
      therapist_id: therapistId,
      status: 'active',
    });

    return {
      tierName,
      displayName: tierConfig.displayName,
      caps: {
        activeClients: {
          current: activeClientsCount,
          limit: tierConfig.caps.activeClients,
          isCapExceeded: activeClientsCount >= tierConfig.caps.activeClients,
        },
      },
      features: {
        soapTemplates: Boolean(tierConfig.featureFlags?.soapTemplates),
        advancedAnalytics: Boolean(tierConfig.featureFlags?.advancedAnalytics),
        customBranding: Boolean(tierConfig.featureFlags?.customBranding),
        prioritySupport: Boolean(tierConfig.featureFlags?.prioritySupport),
      },
    };
  }
}

module.exports = new EntitlementService();
