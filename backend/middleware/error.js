const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log error using Winston
  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    stack: err.stack,
  });

  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      error: err.message,
      stack: err.stack,
      status: err.status,
    });
  }

  // Production response (omit stack trace)
  res.status(err.statusCode).json({
    error: err.message || "Something went wrong on the server.",
  });
};

module.exports = errorHandler;
