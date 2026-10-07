const SessionNote = require('../models/SessionNote');
const Session = require('../models/Session');
const entitlementService = require('../services/entitlementService');

/**
 * Defensive serializer to enforce absolute data isolation for the client portal.
 * Guarantees that no private clinician notes, internal hypotheses, or sensitive
 * diagnostic metadata ever leave the API boundary.
 */
const serializeSharedNoteForClient = (note) => {
  if (!note || note.type !== 'shared') {
    return null;
  }

  return {
    id: note._id,
    sessionId: note.session_id,
    type: 'shared',
    templateType: note.templateType,
    // Provide clean body or shared action steps/reflections
    content: {
      body: note.content?.body || '',
      plan: note.content?.soap?.plan || note.content?.dap?.plan || '',
    },
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    signedByTherapist: note.signedByTherapist,
  };
};

class NoteController {
  /**
   * THERAPIST ENDPOINT: Create or update a session clinical note.
   * Enforces entitlement gating on SOAP/DAP templates.
   */
  async saveNote(req, res) {
    try {
      const therapistId = req.therapist._id;
      const { sessionId, clientId, type = 'private', templateType = 'freeform', content } = req.body;

      if (!sessionId || !clientId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'sessionId and clientId are required.',
        });
      }

      // 1. Verify session belongs to this therapist
      const session = await Session.findOne({ _id: sessionId, therapist_id: therapistId });
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'SESSION_NOT_FOUND',
          message: 'Session not found or does not belong to this therapist.',
        });
      }

      // 2. Entitlement Check for Structured Clinical Templates (SOAP / DAP)
      if (templateType === 'SOAP' || templateType === 'DAP') {
        const entitlement = await entitlementService.canAccess(therapistId, 'soap_templates');
        if (!entitlement.allowed) {
          return res.status(403).json({
            success: false,
            error: 'FEATURE_LOCKED',
            message: 'SOAP and DAP structured templates require a Pro or Clinic subscription tier.',
            upgradePrompt: entitlement.upgradePrompt,
          });
        }
      }

      // 3. Upsert note by session_id and type
      let note = await SessionNote.findOne({
        session_id: sessionId,
        therapist_id: therapistId,
        type,
      });

      if (note) {
        note.templateType = templateType;
        note.content = content || {};
        await note.save();
      } else {
        note = await SessionNote.create({
          session_id: sessionId,
          therapist_id: therapistId,
          client_id: clientId,
          type,
          templateType,
          content: content || {},
        });
      }

      return res.status(200).json({
        success: true,
        message: `${type === 'private' ? 'Private clinical' : 'Shared client'} note saved successfully.`,
        data: note,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * THERAPIST ENDPOINT: Fetch all notes for a session (returns both private and shared).
   */
  async getNotesForSession(req, res) {
    try {
      const therapistId = req.therapist._id;
      const { sessionId } = req.params;

      const notes = await SessionNote.find({
        session_id: sessionId,
        therapist_id: therapistId,
      }).sort({ createdAt: 1 });

      return res.status(200).json({
        success: true,
        data: {
          privateNote: notes.find((n) => n.type === 'private') || null,
          sharedNote: notes.find((n) => n.type === 'shared') || null,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * THERAPIST ENDPOINT: Fetch complete chronological note history for a client.
   */
  async getNotesForClient(req, res) {
    try {
      const therapistId = req.therapist._id;
      const { clientId } = req.params;

      const notes = await SessionNote.find({
        client_id: clientId,
        therapist_id: therapistId,
      })
        .populate('session_id', 'startTime endTime status')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: notes.length,
        data: notes,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * CLIENT PORTAL ENDPOINT: Retrieve notes shared with the client.
   *
   * STRICT ACCESS CONTROL & ZERO-LEAK GUARANTEE:
   * 1. Query level filter: explicitly mandates { client_id: clientId, type: 'shared' }
   * 2. Serializer layer: passes results through serializeSharedNoteForClient()
   * 3. Under NO CIRCUMSTANCES are private notes ever queried or returned.
   */
  async getClientPortalNotes(req, res) {
    try {
      const clientId = req.user?.clientId || req.client?._id;

      if (!clientId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED_CLIENT',
          message: 'Client authentication is required to access shared notes.',
        });
      }

      // Hardcoded query filter: ONLY type = 'shared'
      const rawSharedNotes = await SessionNote.find({
        client_id: clientId,
        type: 'shared',
      })
        .populate('session_id', 'startTime duration')
        .sort({ createdAt: -1 })
        .lean();

      // Defensive filtering and field sanitization
      const sanitizedNotes = rawSharedNotes
        .map(serializeSharedNoteForClient)
        .filter(Boolean);

      return res.status(200).json({
        success: true,
        count: sanitizedNotes.length,
        data: sanitizedNotes,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * CLIENT PORTAL ENDPOINT: Retrieve a single shared note by ID.
   * Rejects any attempt to view private notes with 404 (preventing note discovery).
   */
  async getClientPortalNoteById(req, res) {
    try {
      const clientId = req.user?.clientId || req.client?._id;
      const { noteId } = req.params;

      const note = await SessionNote.findOne({
        _id: noteId,
        client_id: clientId,
        type: 'shared', // Enforce shared restriction
      }).lean();

      if (!note) {
        return res.status(404).json({
          success: false,
          error: 'NOTE_NOT_FOUND',
          message: 'No shared note found matching the requested identifier.',
        });
      }

      const sanitizedNote = serializeSharedNoteForClient(note);

      // Record client view timestamp
      await SessionNote.findByIdAndUpdate(noteId, { $set: { clientViewedAt: new Date() } });

      return res.status(200).json({
        success: true,
        data: sanitizedNote,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * THERAPIST ENDPOINT: Electronically sign a clinical note.
   */
  async signNote(req, res) {
    try {
      const therapistId = req.therapist._id;
      const { noteId } = req.params;

      const note = await SessionNote.findOneAndUpdate(
        { _id: noteId, therapist_id: therapistId },
        { $set: { signedByTherapist: true, signedAt: new Date() } },
        { new: true }
      );

      if (!note) {
        return res.status(404).json({ success: false, error: 'NOTE_NOT_FOUND' });
      }

      return res.status(200).json({ success: true, message: 'Note signed successfully.', data: note });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new NoteController();
