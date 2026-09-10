import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { generateToken } from "../utils/jwt.js";
import { comparePassword } from "../utils/password.js";

export async function login(request: Request, response: Response): Promise<void> {
  const { email, password } = request.body ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      firstName: true,
      lastName: true,
      roleId: true,
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError("Invalid credentials.", 401);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials.", 401);
  }

  const token = generateToken({ userId: user.id });

  const safeUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roleId: user.roleId,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  response.status(200).json({
    success: true,
    data: {
      token,
      user: safeUser,
    },
  });
}

export async function getCurrentUser(request: Request, response: Response): Promise<void> {
  if (!request.user) {
    throw new AppError("Authentication required.", 401);
  }

  response.status(200).json({
    success: true,
    data: request.user,
  });
}

export async function logout(_request: Request, response: Response): Promise<void> {
  // Stateless JWT logout: client-side token removal. Server acknowledges successfully.
  response.status(200).json({
    success: true,
    message: "Logged out successfully. Please remove the token client-side.",
  });
}
