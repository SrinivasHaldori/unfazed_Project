const express = require('express');
const router = express.Router();
const therapistController = require('../controllers/therapistController');
const { requireTherapistAuth } = require('../middleware/authMiddleware');

// Public profile by slug
router.get('/public/:slug', therapistController.getPublicProfile);

// Authenticated therapist routes
router.put('/profile', requireTherapistAuth, therapistController.updateProfile);
router.get('/entitlements', requireTherapistAuth, therapistController.getMyEntitlements);
router.post('/tier/update', requireTherapistAuth, therapistController.updateSubscriptionTier);

module.exports = router;
