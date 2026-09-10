import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

export function requireRole(...allowedRoles: string[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.user) {
      throw new AppError("Authentication required.", 401);
    }

    if (!allowedRoles.includes(request.user.role.name)) {
      throw new AppError("Access denied. Insufficient permissions.", 403);
    }

    next();
  };
}
