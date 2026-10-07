const jwt = require('jsonwebtoken');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Availability = require('../models/Availability');
const { generateUniqueSlug } = require('../utils/generateSlug');

const signToken = (id, role = 'therapist') => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'unfazed_super_secure_jwt_secret_key_2025_india',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

class AuthController {
  /**
   * Therapist Registration
   */
  async register(req, res) {
    try {
      const { name, email, password, title, specializations, languages, phone } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Name, email, and password are required.',
        });
      }

      const existing = await Therapist.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists.',
        });
      }

      const slug = await generateUniqueSlug(name);

      const therapist = new Therapist({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: password, // Pre-save hook hashes it
        slug,
        title: title || 'Licensed Clinical Psychologist / Therapist',
        specializations: specializations || ['Anxiety', 'Depression', 'Stress Management'],
        languages: languages || ['English', 'Hindi'],
        phone: phone || '',
        subscriptionTier: 'free',
      });

      await therapist.save();

      // Seed default availability schedule for the therapist
      await Availability.create({ therapist_id: therapist._id });

      const token = signToken(therapist._id, 'therapist');

      return res.status(201).json({
        success: true,
        message: 'Therapist account registered successfully.',
        token,
        therapist: therapist.toJSON(),
      });
    } catch (error) {
      console.error(`[Register Error] ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Therapist Login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'Email and password are required.',
        });
      }

      const therapist = await Therapist.findOne({ email: email.toLowerCase().trim() }).select('+password_hash');
      if (!therapist) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        });
      }

      const isMatch = await therapist.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        });
      }

      const token = signToken(therapist._id, 'therapist');

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        token,
        therapist: therapist.toJSON(),
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Client Portal Quick Auth / Token Generation (by email and client ID)
   */
  async clientLogin(req, res) {
    try {
      const { email, clientId } = req.body;
      const client = await Client.findOne({ _id: clientId, email: email.toLowerCase().trim() });

      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'CLIENT_NOT_FOUND',
          message: 'No client record matches the provided details.',
        });
      }

      const token = signToken(client._id, 'client');

      return res.status(200).json({
        success: true,
        message: 'Client portal authenticated.',
        token,
        client: {
          id: client._id,
          name: client.name,
          email: client.email,
          therapistId: client.therapist_id,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Current Authenticated Profile
   */
  async getMe(req, res) {
    try {
      const therapist = await Therapist.findById(req.therapist._id);
      return res.status(200).json({ success: true, data: therapist });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AuthController();
