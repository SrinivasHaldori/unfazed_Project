/**
 * Centralized Global Error Handler
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${err.name || 'Error'}: ${err.message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      messages,
    });
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: 'DUPLICATE_KEY_ERROR',
      message: `A record with this ${field} already exists.`,
    });
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'INVALID_ID_FORMAT',
      message: `Invalid identifier format: ${err.value}`,
    });
  }

  // Default server error
  return res.status(err.statusCode || 500).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred on the server.',
  });
};

module.exports = errorHandler;
