const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireTherapistAuth } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/client-login', authController.clientLogin);
router.get('/me', requireTherapistAuth, authController.getMe);

module.exports = router;
