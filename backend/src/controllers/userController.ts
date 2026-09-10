import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { hashPassword } from "../utils/password.js";

const SUPPORTED_ROLES = ["Administrator", "Service Desk Analyst"] as const;
type SupportedRole = (typeof SUPPORTED_ROLES)[number];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

interface SafeUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

function formatUserResponse(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: { name: string };
  createdAt: Date;
  updatedAt: Date;
}): SafeUserResponse {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listUsers(_request: Request, response: Response): Promise<void> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: {
        select: {
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  const formattedUsers = users.map(formatUserResponse);

  response.status(200).json({
    success: true,
    data: formattedUsers,
  });
}

export async function getUserById(request: Request, response: Response): Promise<void> {
  const userId = request.params.id;
  if (!userId || Array.isArray(userId)) {
    throw new AppError("User not found.", 404);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: {
        select: {
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  response.status(200).json({
    success: true,
    data: formatUserResponse(user),
  });
}

export async function createUser(request: Request, response: Response): Promise<void> {
  const rawFirstName = request.body?.firstName;
  const rawLastName = request.body?.lastName;
  const rawEmail = request.body?.email;
  const rawPassword = request.body?.password;
  const rawRole = request.body?.role;

  const firstName = readOptionalString(rawFirstName);
  const lastName = readOptionalString(rawLastName);
  const email = readOptionalString(rawEmail);
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const roleName = readOptionalString(rawRole);

  if (!firstName || !lastName || !email || !password || !roleName) {
    throw new AppError("firstName, lastName, email, password, and role are required.", 400);
  }

  const normalizedEmail = email.toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    throw new AppError("Invalid email address format.", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters long.", 400);
  }

  if (!SUPPORTED_ROLES.includes(roleName as SupportedRole)) {
    throw new AppError(`Invalid role. Role must be one of: ${SUPPORTED_ROLES.join(", ")}.`, 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("A user with this email address already exists.", 400);
  }

  const roleRecord = await prisma.role.findUnique({
    where: { name: roleName },
    select: { id: true, name: true },
  });

  if (!roleRecord) {
    throw new AppError("The specified role does not exist.", 400);
  }

  const passwordHash = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      roleId: roleRecord.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: {
        select: {
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  response.status(201).json({
    success: true,
    data: formatUserResponse(newUser),
  });
}

export async function updateUser(request: Request, response: Response): Promise<void> {
  const userId = request.params.id;
  if (!userId || Array.isArray(userId)) {
    throw new AppError("User not found.", 404);
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      roleId: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!existingUser) {
    throw new AppError("User not found.", 404);
  }

  const { firstName, lastName, email, role: roleName } = request.body ?? {};

  // Self-action protection: Prevent Administrator from changing their own role away from Administrator
  if (request.user && request.user.id === existingUser.id && roleName !== undefined) {
    if (roleName !== "Administrator") {
      throw new AppError("Administrators cannot remove their own Administrator role.", 400);
    }
  }

  const updateData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    roleId?: string;
  } = {};

  if (firstName !== undefined) {
    const trimmedFirstName = readOptionalString(firstName);
    if (!trimmedFirstName) {
      throw new AppError("firstName cannot be empty.", 400);
    }
    updateData.firstName = trimmedFirstName;
  }

  if (lastName !== undefined) {
    const trimmedLastName = readOptionalString(lastName);
    if (!trimmedLastName) {
      throw new AppError("lastName cannot be empty.", 400);
    }
    updateData.lastName = trimmedLastName;
  }

  if (email !== undefined) {
    const trimmedEmail = readOptionalString(email);
    if (!trimmedEmail) {
      throw new AppError("email cannot be empty.", 400);
    }
    const normalizedEmail = trimmedEmail.toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      throw new AppError("Invalid email address format.", 400);
    }

    if (normalizedEmail !== existingUser.email) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: userId },
        },
        select: { id: true },
      });

      if (duplicateUser) {
        throw new AppError("A user with this email address already exists.", 400);
      }
      updateData.email = normalizedEmail;
    }
  }

  if (roleName !== undefined) {
    const trimmedRoleName = readOptionalString(roleName);
    if (!trimmedRoleName || !SUPPORTED_ROLES.includes(trimmedRoleName as SupportedRole)) {
      throw new AppError(`Invalid role. Role must be one of: ${SUPPORTED_ROLES.join(", ")}.`, 400);
    }

    if (trimmedRoleName !== existingUser.role.name) {
      const roleRecord = await prisma.role.findUnique({
        where: { name: trimmedRoleName },
        select: { id: true },
      });

      if (!roleRecord) {
        throw new AppError("The specified role does not exist.", 400);
      }
      updateData.roleId = roleRecord.id;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: {
        select: {
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  response.status(200).json({
    success: true,
    data: formatUserResponse(updatedUser),
  });
}
