const Therapist = require('../models/Therapist');
const entitlementService = require('../services/entitlementService');
const { generateUniqueSlug } = require('../utils/generateSlug');

class TherapistController {
  /**
   * Public Profile Endpoint (/:slug)
   */
  async getPublicProfile(req, res) {
    try {
      const { slug } = req.params;

      const therapist = await Therapist.findOne({ slug, isActive: true })
        .select('name slug title bio specializations languages avatarUrl currency phone')
        .lean();

      if (!therapist) {
        return res.status(404).json({
          success: false,
          error: 'THERAPIST_NOT_FOUND',
          message: `Therapist profile '/${slug}' not found.`,
        });
      }

      return res.status(200).json({
        success: true,
        data: therapist,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update Profile (Bio, Specializations, Languages, etc.)
   */
  async updateProfile(req, res) {
    try {
      const therapistId = req.therapist._id;
      const { name, bio, specializations, languages, title, phone, avatarUrl } = req.body;

      const updates = {};
      if (name) updates.name = name.trim();
      if (bio !== undefined) updates.bio = bio;
      if (specializations) updates.specializations = specializations;
      if (languages) updates.languages = languages;
      if (title) updates.title = title;
      if (phone !== undefined) updates.phone = phone;
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

      const therapist = await Therapist.findByIdAndUpdate(
        therapistId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Therapist profile updated successfully.',
        data: therapist,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Upgrades or updates therapist subscription tier.
   * Useful for testing tier gates and simulated upgrades in non-payment environments.
   */
  async updateSubscriptionTier(req, res) {
    try {
      const therapistId = req.therapist._id;
      const { tier } = req.body;

      if (!['free', 'pro', 'clinic'].includes(tier)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_TIER',
          message: "Tier must be one of: 'free', 'pro', 'clinic'.",
        });
      }

      const therapist = await Therapist.findByIdAndUpdate(
        therapistId,
        { $set: { subscriptionTier: tier } },
        { new: true }
      );

      const entitlements = await entitlementService.getTherapistEntitlements(therapistId);

      return res.status(200).json({
        success: true,
        message: `Plan successfully updated to ${tier.toUpperCase()}.`,
        therapist,
        entitlements,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Returns current entitlement breakdown for frontend useEntitlement hook.
   */
  async getMyEntitlements(req, res) {
    try {
      const entitlements = await entitlementService.getTherapistEntitlements(req.therapist._id);
      return res.status(200).json({ success: true, data: entitlements });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new TherapistController();
