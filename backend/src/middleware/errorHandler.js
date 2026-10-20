import { ApiError } from "../utils/ApiError.js";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message
    }));
    error = new ApiError(400, "Validation Error", formattedErrors);
  }

  // Handle Mongoose Duplicate Key Error (e.g. 11000)
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    error = new ApiError(409, `A record with this ${field} already exists.`);
  }

  // Handle Mongoose Validation Error
  else if (err.name === "ValidationError") {
    const formattedErrors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message
    }));
    error = new ApiError(400, "Invalid data provided", formattedErrors);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  else if (err.name === "CastError") {
    error = new ApiError(400, `Resource not found with id: ${err.value}`);
  }

  // Handle JWT Verification Errors
  else if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid authentication token");
  } else if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Authentication token has expired");
  }

  // Fallback to generic ApiError
  else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || []
  };

  if (env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  return res.status(error.statusCode).json(response);
};
