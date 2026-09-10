import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, next): void => {
  void next;
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : "Internal server error.";

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    success: false,
    message,
    ...(env.nodeEnv === "development" && !(error instanceof AppError) ? { stack: error.stack } : {}),
  });
};
