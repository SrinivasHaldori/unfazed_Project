const jwt = require('jsonwebtoken');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');

/**
 * Therapist Authentication Middleware
 * Protects clinical and administrative routes.
 */
const requireTherapistAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'No authorization token provided or invalid format.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'unfazed_super_secure_jwt_secret_key_2025_india');

    if (decoded.role && decoded.role !== 'therapist') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ROLE',
        message: 'This endpoint requires therapist privileges.',
      });
    }

    const therapist = await Therapist.findById(decoded.id).lean();
    if (!therapist || !therapist.isActive) {
      return res.status(401).json({
        success: false,
        error: 'ACCOUNT_INVALID',
        message: 'Therapist account does not exist or has been deactivated.',
      });
    }

    req.therapist = therapist;
    req.user = { id: therapist._id.toString(), role: 'therapist' };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Session token has expired. Please sign in again.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or malformed authorization token.',
    });
  }
};

/**
 * Client Portal Authentication Middleware
 * Validates client tokens for reading shared notes and accessing client portal sessions/chat.
 */
const requireClientAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'No client authorization token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'unfazed_super_secure_jwt_secret_key_2025_india');

    if (decoded.role !== 'client') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ROLE',
        message: 'This endpoint is restricted to authenticated clients.',
      });
    }

    const client = await Client.findById(decoded.id).lean();
    if (!client) {
      return res.status(401).json({
        success: false,
        error: 'CLIENT_NOT_FOUND',
        message: 'Client record not found.',
      });
    }

    req.client = client;
    req.user = { id: client._id.toString(), role: 'client', clientId: client._id.toString() };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_CLIENT_TOKEN',
      message: 'Client session token is invalid or expired.',
    });
  }
};

module.exports = {
  requireTherapistAuth,
  requireClientAuth,
};
