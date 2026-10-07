const mongoose = require('mongoose');

let mongoMemoryServer = null;

const seedInitialData = async () => {
  try {
    const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
    const Therapist = require('../models/Therapist');
    const Availability = require('../models/Availability');
    const Client = require('../models/Client');
    const Session = require('../models/Session');
    const SessionNote = require('../models/SessionNote');

    // 1. Seed Tiers
    for (const [tierKey, tierData] of Object.entries(SubscriptionTierConfig.DEFAULT_TIERS)) {
      await SubscriptionTierConfig.findOneAndUpdate(
        { tierName: tierKey },
        { $set: tierData },
        { upsert: true, new: true }
      );
    }
    console.log('[Database] Subscription tiers verified/seeded.');

    // 2. Seed Demo Therapist if not present
    let therapist = await Therapist.findOne({ email: 'dr.sharma@unfazed.in' });
    if (!therapist) {
      therapist = new Therapist({
        name: 'Dr. Anjali Sharma',
        email: 'dr.sharma@unfazed.in',
        password_hash: 'password123', // Pre-save hook hashes it
        slug: 'dr-anjali-sharma',
        title: 'Senior Clinical Psychologist, RCI Certified',
        bio: 'Compassionate, evidence-based psychotherapist specializing in Cognitive Behavioral Therapy (CBT), anxiety disorders, depression, and adult trauma recovery. Offering culturally attuned tele-counseling across India.',
        specializations: ['Anxiety Disorders', 'CBT', 'Depression', 'Trauma & PTSD', 'Relationship Distress'],
        languages: ['English', 'Hindi', 'Bengali'],
        phone: '+91 98765 43210',
        subscriptionTier: 'pro',
      });
      await therapist.save();
      console.log('[Database] Demo Therapist created: dr.sharma@unfazed.in / password123 (Slug: dr-anjali-sharma)');

      // Create Availability
      await Availability.create({ therapist_id: therapist._id });

      // Create a couple demo clients and sessions
      const client1 = await Client.create({
        therapist_id: therapist._id,
        name: 'Aarav Mehta',
        email: 'aarav.mehta@example.com',
        phone: '+91 98200 12345',
        status: 'active',
        tags: ['CBT Track', 'Workplace Anxiety'],
        consentGiven: true,
        consentTimestamp: new Date(),
        consentIpAddress: '127.0.0.1',
        intakeData: {
          presentingConcern: 'Chronic anxiety triggered by startup work pressures and sleep disruption.',
          goals: 'Develop cognitive restructuring skills and restore regular sleep cycles.',
        },
      });

      const client2 = await Client.create({
        therapist_id: therapist._id,
        name: 'Rhea Sen',
        email: 'rhea.sen@example.com',
        phone: '+91 98300 54321',
        status: 'active',
        tags: ['Mindfulness', 'Relationship'],
        consentGiven: true,
        consentTimestamp: new Date(),
        consentIpAddress: '127.0.0.1',
        intakeData: {
          presentingConcern: 'Communication breakdown and boundary issues in personal relationships.',
          goals: 'Learn assertive communication and emotional self-regulation.',
        },
      });

      // Create sessions
      const now = new Date();
      const pastSession = await Session.create({
        therapist_id: therapist._id,
        client_id: client1._id,
        startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
        duration: 50,
        status: 'completed',
      });

      const futureSession = await Session.create({
        therapist_id: therapist._id,
        client_id: client1._id,
        startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
        duration: 50,
        status: 'booked',
      });

      // Create clinical notes
      await SessionNote.create({
        session_id: pastSession._id,
        therapist_id: therapist._id,
        client_id: client1._id,
        type: 'private',
        templateType: 'SOAP',
        content: {
          soap: {
            subjective: 'Client reports feeling overwhelmed with quarterly deadlines.',
            objective: 'Appropriately dressed, flat affect, speech rapid but coherent.',
            assessment: 'Generalized anxiety with cognitive catastrophizing patterns.',
            plan: 'Assigned thought record diary. Next session in 7 days.',
          },
        },
        signedByTherapist: true,
        signedAt: new Date(),
      });

      await SessionNote.create({
        session_id: pastSession._id,
        therapist_id: therapist._id,
        client_id: client1._id,
        type: 'shared',
        templateType: 'freeform',
        content: {
          body: 'Session Takeaways: Remember to pause when notice somatic signs of tension. Practice 4-7-8 breathing for 5 minutes before morning meetings.',
        },
      });

      console.log('[Database] Demo clients, sessions, and clinical notes populated successfully.');
    }
  } catch (err) {
    console.error(`[Database Seed Error] ${err.message}`);
  }
};

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/unfazed_db';

  try {
    // Attempt connecting to local MongoDB with a 3-second timeout
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
      autoIndex: true,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    await seedInitialData();
  } catch (err) {
    console.log(`[Database] Local MongoDB not reachable (${err.message}). Starting embedded in-memory MongoDB...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(memoryUri, { autoIndex: true });
      console.log(`[Database] Embedded In-Memory MongoDB Connected at: ${memoryUri}`);
      await seedInitialData();
    } catch (fallbackErr) {
      console.error(`[Database Fatal Error] Failed to connect to any MongoDB instance: ${fallbackErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
