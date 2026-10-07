const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { requireTherapistAuth, requireClientAuth } = require('../middleware/authMiddleware');

// Client Portal (Strictly Shared Notes Only)
router.get('/portal/my-notes', requireClientAuth, noteController.getClientPortalNotes);
router.get('/portal/my-notes/:noteId', requireClientAuth, noteController.getClientPortalNoteById);

// Therapist Routes (Full Clinical Access & Gated Templates)
router.post('/', requireTherapistAuth, noteController.saveNote);
router.get('/session/:sessionId', requireTherapistAuth, noteController.getNotesForSession);
router.get('/client/:clientId', requireTherapistAuth, noteController.getNotesForClient);
router.patch('/:noteId/sign', requireTherapistAuth, noteController.signNote);

module.exports = router;
