const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/schedulingController');
const { requireTherapistAuth } = require('../middleware/authMiddleware');

// Public booking endpoints
router.get('/public-slots/:slug', schedulingController.getPublicAvailableSlots);
router.post('/book', schedulingController.bookSession);

// Therapist private management endpoints
router.get('/availability', requireTherapistAuth, schedulingController.getMyAvailability);
router.put('/availability', requireTherapistAuth, schedulingController.updateAvailability);
router.get('/sessions', requireTherapistAuth, schedulingController.getTherapistSessions);
router.patch('/sessions/:id/status', requireTherapistAuth, schedulingController.updateSessionStatus);

module.exports = router;
