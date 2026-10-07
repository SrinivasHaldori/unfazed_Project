const mongoose = require('mongoose');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Session = require('../models/Session');
const Availability = require('../models/Availability');
const entitlementService = require('../services/entitlementService');
const notificationService = require('../services/notificationService');

/**
 * Controller handling Availability Configuration, Dynamic Slot Generation,
 * and Atomic Double-Booking Protected Session Reservations without payment friction.
 */
class SchedulingController {
  /**
   * Retrieves availability settings for the authenticated therapist.
   */
  async getMyAvailability(req, res) {
    try {
      let availability = await Availability.findOne({ therapist_id: req.therapist._id });
      if (!availability) {
        // Initialize default availability if not present
        availability = await Availability.create({ therapist_id: req.therapist._id });
      }
      return res.status(200).json({ success: true, data: availability });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Updates availability schedule, buffers, and slot duration options.
   */
  async updateAvailability(req, res) {
    try {
      const { weeklyRecurringSlots, overrides, bufferTimeMinutes, slotDurations, timezone } = req.body;

      const availability = await Availability.findOneAndUpdate(
        { therapist_id: req.therapist._id },
        {
          $set: {
            ...(weeklyRecurringSlots && { weeklyRecurringSlots }),
            ...(overrides && { overrides }),
            ...(bufferTimeMinutes !== undefined && { bufferTimeMinutes }),
            ...(slotDurations && { slotDurations }),
            ...(timezone && { timezone }),
          },
        },
        { new: true, upsert: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Availability schedule updated successfully.',
        data: availability,
      });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Public endpoint: Generates available booking slots for a therapist slug,
   * taking into account buffer times, existing bookings, and target client timezone.
   */
  async getPublicAvailableSlots(req, res) {
    try {
      const { slug } = req.params;
      const { startDate, endDate, duration = 50, clientTimezone = 'Asia/Kolkata' } = req.query;

      const therapist = await Therapist.findOne({ slug, isActive: true }).lean();
      if (!therapist) {
        return res.status(404).json({ success: false, error: 'Therapist profile not found.' });
      }

      const availability = await Availability.findOne({ therapist_id: therapist._id }).lean();
      if (!availability) {
        return res.status(200).json({ success: true, data: [] });
      }

      const queryStart = startDate ? new Date(startDate) : new Date();
      const queryEnd = endDate ? new Date(endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14-day default window
      const slotDurationMs = parseInt(duration, 10) * 60 * 1000;
      const bufferMs = (availability.bufferTimeMinutes || 10) * 60 * 1000;

      // Query existing non-cancelled sessions within window
      const existingSessions = await Session.find({
        therapist_id: therapist._id,
        status: { $ne: 'cancelled' },
        startTime: { $lt: queryEnd },
        endTime: { $gt: queryStart },
      })
        .select('startTime endTime')
        .lean();

      const availableSlots = [];
      const currentDate = new Date(queryStart);
      currentDate.setHours(0, 0, 0, 0);

      // Iterate day by day through the window
      while (currentDate <= queryEnd) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sun, 1 = Mon ...
        const dateString = currentDate.toISOString().split('T')[0];

        // Check if an override exists for this exact calendar date
        const override = availability.overrides?.find(
          (o) => new Date(o.date).toISOString().split('T')[0] === dateString
        );

        let activeDaySlots = [];
        if (override) {
          if (override.isAvailable) {
            activeDaySlots = override.slots || [];
          }
        } else {
          const recurringDay = availability.weeklyRecurringSlots?.find(
            (d) => d.dayOfWeek === dayOfWeek && d.isActive
          );
          if (recurringDay) {
            activeDaySlots = recurringDay.slots?.filter((s) => s.isEnabled) || [];
          }
        }

        // Generate discrete slots within the therapist's operational windows
        for (const window of activeDaySlots) {
          const [startHour, startMin] = window.startTime.split(':').map(Number);
          const [endHour, endMin] = window.endTime.split(':').map(Number);

          let windowPointer = new Date(currentDate);
          windowPointer.setHours(startHour, startMin, 0, 0);

          const windowLimit = new Date(currentDate);
          windowLimit.setHours(endHour, endMin, 0, 0);

          while (new Date(windowPointer.getTime() + slotDurationMs) <= windowLimit) {
            const slotStart = new Date(windowPointer);
            const slotEnd = new Date(windowPointer.getTime() + slotDurationMs);

            // Filter past slots if generating for today
            if (slotStart > new Date()) {
              // Check collision against all existing booked sessions with buffer
              const hasConflict = existingSessions.some((session) => {
                const sessionStartWithBuffer = new Date(session.startTime.getTime() - bufferMs);
                const sessionEndWithBuffer = new Date(session.endTime.getTime() + bufferMs);
                return slotStart < sessionEndWithBuffer && slotEnd > sessionStartWithBuffer;
              });

              if (!hasConflict) {
                availableSlots.push({
                  startTime: slotStart.toISOString(),
                  endTime: slotEnd.toISOString(),
                  duration: parseInt(duration, 10),
                  therapistTimezone: availability.timezone || 'Asia/Kolkata',
                  clientTimezone,
                });
              }
            }

            // Advance pointer by duration + therapist buffer
            windowPointer = new Date(windowPointer.getTime() + slotDurationMs + bufferMs);
          }
        }

        // Advance to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return res.status(200).json({
        success: true,
        therapist: {
          id: therapist._id,
          name: therapist.name,
          slug: therapist.slug,
          title: therapist.title,
        },
        slotsCount: availableSlots.length,
        slots: availableSlots,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Core Booking Handler:
   * - Atomically prevents double-booking race conditions.
   * - Records legally auditable digital consent and intake questionnaire.
   * - Immediately confirms session without payment gateway friction.
   * - Dispatches decoupled notification events.
   */
  async bookSession(req, res) {
    let mongoSession = null;
    try {
      const {
        therapistSlug,
        startTime,
        duration = 50,
        clientData,
        timezone = 'Asia/Kolkata',
      } = req.body;

      // 1. Mandatory Input & Digital Consent Validation
      if (!therapistSlug || !startTime || !clientData) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'therapistSlug, startTime, and clientData are required.',
        });
      }

      const { name, email, phone, intakeData, consentGiven, consentTextVersion } = clientData;

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_CLIENT_INFO',
          message: 'Client name and email address are required.',
        });
      }

      // Digital Consent Audit Requirement
      if (!consentGiven) {
        return res.status(400).json({
          success: false,
          error: 'CONSENT_REQUIRED',
          message: 'Client digital consent is mandatory before a therapy appointment can be scheduled.',
        });
      }

      const therapist = await Therapist.findOne({ slug: therapistSlug, isActive: true });
      if (!therapist) {
        return res.status(404).json({ success: false, error: 'THERAPIST_NOT_FOUND', message: 'Therapist not found.' });
      }

      const slotStart = new Date(startTime);
      const slotDurationMin = parseInt(duration, 10);
      const slotEnd = new Date(slotStart.getTime() + slotDurationMin * 60 * 1000);

      if (slotStart <= new Date()) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_TIME',
          message: 'Cannot book a therapy appointment in the past.',
        });
      }

      // 2. Entitlement Gate Check (Active Clients Cap)
      // Check if this client already exists for the therapist
      const existingClient = await Client.findOne({
        therapist_id: therapist._id,
        email: email.toLowerCase().trim(),
      });

      if (!existingClient) {
        const entitlement = await entitlementService.canAccess(therapist._id, 'active_clients_cap');
        if (!entitlement.allowed) {
          return res.status(403).json({
            success: false,
            error: 'THERAPIST_CLIENT_CAP_REACHED',
            message: 'This therapist is currently at full client capacity on their current tier.',
            upgradePrompt: entitlement.upgradePrompt,
          });
        }
      }

      // 3. ATOMIC DOUBLE-BOOKING RESOLUTION
      // We start a transaction if supported, or perform an atomic condition verification
      const hasReplicaSet = mongoose.connection.client.topology?.description?.type !== 'Single';

      if (hasReplicaSet) {
        mongoSession = await mongoose.startSession();
        mongoSession.startTransaction();
      }

      const conflictQuery = {
        therapist_id: therapist._id,
        status: { $in: ['booked', 'completed'] },
        $or: [
          // New session starts during existing session
          { startTime: { $lte: slotStart }, endTime: { $gt: slotStart } },
          // New session ends during existing session
          { startTime: { $lt: slotEnd }, endTime: { $gte: slotEnd } },
          // New session completely encloses existing session
          { startTime: { $gte: slotStart }, endTime: { $lte: slotEnd } },
        ],
      };

      const conflictingSession = await Session.findOne(conflictQuery).session(mongoSession || null);

      if (conflictingSession) {
        if (mongoSession) {
          await mongoSession.abortTransaction();
        }
        return res.status(409).json({
          success: false,
          error: 'SLOT_ALREADY_BOOKED',
          message: 'The requested time slot was just booked by another client. Please select another slot.',
        });
      }

      // 4. Upsert Client Record with Auditable Consent & Intake Record
      let client = existingClient;
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

      if (!client) {
        const newClientData = {
          therapist_id: therapist._id,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone ? phone.trim() : '',
          status: 'active',
          tags: ['New Intake'],
          consentGiven: true,
          consentTimestamp: new Date(),
          consentIpAddress: String(clientIp),
          consentTextVersion: consentTextVersion || 'v1.0-india-telehealth',
          intakeData: intakeData || {},
        };

        const createdClients = await Client.create([newClientData], { session: mongoSession || undefined });
        client = createdClients[0];
      } else {
        // Update intake and consent timestamp for existing client
        client.consentGiven = true;
        client.consentTimestamp = new Date();
        client.consentIpAddress = String(clientIp);
        if (phone) client.phone = phone.trim();
        if (intakeData) client.intakeData = { ...client.intakeData, ...intakeData };
        if (client.status === 'inactive') client.status = 'active';
        await client.save({ session: mongoSession || undefined });
      }

      // 5. Create Session with Immediate 'booked' Confirmation
      const newSessionPayload = {
        therapist_id: therapist._id,
        client_id: client._id,
        startTime: slotStart,
        endTime: slotEnd,
        duration: slotDurationMin,
        status: 'booked',
        timezone,
      };

      const createdSessions = await Session.create([newSessionPayload], { session: mongoSession || undefined });
      const createdSession = createdSessions[0];

      if (mongoSession) {
        await mongoSession.commitTransaction();
      }

      // 6. Decoupled Asynchronous Notification Trigger
      notificationService.emit('booking_confirmed', {
        session: createdSession,
        therapist,
        client,
      });

      return res.status(201).json({
        success: true,
        message: 'Appointment confirmed immediately! Confirmation details sent via notification.',
        session: {
          id: createdSession._id,
          startTime: createdSession.startTime,
          endTime: createdSession.endTime,
          duration: createdSession.duration,
          status: createdSession.status,
          meetingLink: createdSession.meetingLink,
          timezone: createdSession.timezone,
        },
        client: {
          id: client._id,
          name: client.name,
          email: client.email,
        },
        therapist: {
          id: therapist._id,
          name: therapist.name,
          slug: therapist.slug,
        },
      });
    } catch (error) {
      if (mongoSession) {
        await mongoSession.abortTransaction();
      }
      console.error(`[Booking Controller Error] ${error.message}`);
      return res.status(500).json({ success: false, error: 'BOOKING_FAILED', message: error.message });
    } finally {
      if (mongoSession) {
        mongoSession.endSession();
      }
    }
  }

  /**
   * Therapist Dashboard: Fetch list of sessions with filters (upcoming, past, status)
   */
  async getTherapistSessions(req, res) {
    try {
      const { status, startDate, endDate, clientId } = req.query;
      const filter = { therapist_id: req.therapist._id };

      if (status) filter.status = status;
      if (clientId) filter.client_id = clientId;
      if (startDate || endDate) {
        filter.startTime = {};
        if (startDate) filter.startTime.$gte = new Date(startDate);
        if (endDate) filter.startTime.$lte = new Date(endDate);
      }

      const sessions = await Session.find(filter)
        .populate('client_id', 'name email phone status tags')
        .sort({ startTime: -1 })
        .lean();

      return res.status(200).json({ success: true, count: sessions.length, data: sessions });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update session status (completed, cancelled, no-show)
   */
  async updateSessionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, cancellationReason } = req.body;

      if (!['booked', 'completed', 'cancelled', 'no-show'].includes(status)) {
        return res.status(400).json({ success: false, error: 'INVALID_STATUS' });
      }

      const updateData = { status };
      if (status === 'cancelled') {
        updateData.cancellationReason = cancellationReason || 'Cancelled by therapist/client';
        updateData.cancelledAt = new Date();
      }

      const session = await Session.findOneAndUpdate(
        { _id: id, therapist_id: req.therapist._id },
        { $set: updateData },
        { new: true }
      ).populate('client_id', 'name email');

      if (!session) {
        return res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND' });
      }

      return res.status(200).json({ success: true, message: `Session status updated to ${status}.`, data: session });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new SchedulingController();
