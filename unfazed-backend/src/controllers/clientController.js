const Client = require('../models/Client');
const Session = require('../models/Session');
const SessionNote = require('../models/SessionNote');
const entitlementService = require('../services/entitlementService');

class ClientController {
  /**
   * List clients for therapist CRM with filtering, tag search, and pagination
   */
  async getClients(req, res) {
    try {
      const therapistId = req.therapist._id;
      const { search, tag, status, page = 1, limit = 50 } = req.query;

      const query = { therapist_id: therapistId };

      if (status) {
        query.status = status;
      }

      if (tag) {
        query.tags = tag;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const [clients, total] = await Promise.all([
        Client.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10))
          .lean(),
        Client.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        data: clients,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Retrieve complete client detail view with auditable intake and aggregated history
   */
  async getClientById(req, res) {
    try {
      const therapistId = req.therapist._id;
      const { id } = req.params;

      const client = await Client.findOne({ _id: id, therapist_id: therapistId }).lean();
      if (!client) {
        return res.status(404).json({ success: false, error: 'CLIENT_NOT_FOUND' });
      }

      // Concurrently query sessions and clinical notes history
      const [sessions, notes] = await Promise.all([
        Session.find({ client_id: id, therapist_id: therapistId }).sort({ startTime: -1 }).lean(),
        SessionNote.find({ client_id: id, therapist_id: therapistId }).sort({ createdAt: -1 }).lean(),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          client,
          sessions,
          notes,
          metrics: {
            totalSessions: sessions.length,
            completedSessions: sessions.filter((s) => s.status === 'completed').length,
            noShowCount: sessions.filter((s) => s.status === 'no-show').length,
            cancelledCount: sessions.filter((s) => s.status === 'cancelled').length,
          },
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Create client manually from therapist CRM dashboard
   * (Enforces active_clients_cap entitlement)
   */
  async createClient(req, res) {
    try {
      const therapistId = req.therapist._id;
      const { name, email, phone, tags, intakeData } = req.body;

      if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Name and email are required.' });
      }

      // Entitlement verification
      const entitlement = await entitlementService.canAccess(therapistId, 'active_clients_cap');
      if (!entitlement.allowed) {
        return res.status(403).json({
          success: false,
          error: 'CAP_EXCEEDED',
          message: 'Active client cap reached.',
          upgradePrompt: entitlement.upgradePrompt,
        });
      }

      const existing = await Client.findOne({
        therapist_id: therapistId,
        email: email.toLowerCase().trim(),
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'CLIENT_EXISTS',
          message: 'A client with this email already exists in your practice roster.',
        });
      }

      const client = await Client.create({
        therapist_id: therapistId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : '',
        tags: tags || ['Direct Intake'],
        intakeData: intakeData || {},
        status: 'active',
        consentGiven: true,
        consentTimestamp: new Date(),
        consentIpAddress: req.ip,
      });

      return res.status(201).json({
        success: true,
        message: 'Client added successfully.',
        data: client,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update client tags, status, or details
   */
  async updateClient(req, res) {
    try {
      const therapistId = req.therapist._id;
      const { id } = req.params;
      const { name, phone, status, tags, intakeData } = req.body;

      const updates = {};
      if (name) updates.name = name.trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (status) updates.status = status;
      if (tags) updates.tags = tags;
      if (intakeData) updates.intakeData = intakeData;

      const client = await Client.findOneAndUpdate(
        { _id: id, therapist_id: therapistId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!client) {
        return res.status(404).json({ success: false, error: 'CLIENT_NOT_FOUND' });
      }

      return res.status(200).json({
        success: true,
        message: 'Client details updated successfully.',
        data: client,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ClientController();
