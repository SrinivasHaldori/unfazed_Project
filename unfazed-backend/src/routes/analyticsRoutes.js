const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { requireTherapistAuth } = require('../middleware/authMiddleware');

router.get('/dashboard', requireTherapistAuth, analyticsController.getDashboardAnalytics.bind(analyticsController));

module.exports = router;
