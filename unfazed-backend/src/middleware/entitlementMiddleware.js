const entitlementService = require('../services/entitlementService');

/**
 * Express Middleware factory to enforce centralized entitlement feature gates.
 *
 * @param {'active_clients_cap'|'soap_templates'|'advanced_analytics'} featureKey
 */
const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const therapistId = req.therapist?._id || req.user?.id;

      if (!therapistId) {
        return res.status(401).json({
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Therapist must be authenticated to evaluate feature entitlements.',
        });
      }

      const entitlement = await entitlementService.canAccess(therapistId, featureKey, {
        body: req.body,
        query: req.query,
      });

      if (!entitlement.allowed) {
        return res.status(403).json({
          success: false,
          error: 'ENTITLEMENT_FORBIDDEN',
          reason: entitlement.reason,
          message:
            entitlement.upgradePrompt?.message ||
            `Access to '${featureKey}' is restricted under your current subscription tier.`,
          upgradePrompt: entitlement.upgradePrompt,
          currentUsage: entitlement.currentUsage,
          limit: entitlement.limit,
          tier: entitlement.tier,
        });
      }

      // Attach entitlement status to request for downstream handlers
      req.entitlement = entitlement;
      next();
    } catch (error) {
      console.error(`[Entitlement Middleware Error] ${error.message}`);
      next(error);
    }
  };
};

module.exports = { requireFeature };
