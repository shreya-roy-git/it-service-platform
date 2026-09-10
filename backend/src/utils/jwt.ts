import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";

export interface TokenPayload {
  userId: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "1d" });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === "object" && decoded !== null && "userId" in decoded && typeof (decoded as TokenPayload).userId === "string") {
      return { userId: (decoded as TokenPayload).userId };
    }
    throw new AppError("Invalid authentication token.", 401);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Invalid or expired authentication token.", 401);
  }
}
