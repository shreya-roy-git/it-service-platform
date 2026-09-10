import { TicketPriority, TicketStatus } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const ticketInclude = {
  project: { select: { id: true, key: true, name: true } },
  creator: { select: { id: true, firstName: true, lastName: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
} as const;

function isEnumValue<T extends Record<string, string>>(enumObject: T, value: unknown): value is T[keyof T] {
  return typeof value === "string" && Object.values(enumObject).includes(value);
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function listTickets(_request: Request, response: Response): Promise<void> {
  const tickets = await prisma.ticket.findMany({ include: ticketInclude, orderBy: { updatedAt: "desc" } });
  response.status(200).json({ success: true, data: tickets });
}

export async function getTicketById(request: Request, response: Response): Promise<void> {
  const ticketId = request.params.id;
  if (!ticketId || Array.isArray(ticketId)) {
    throw new AppError("Ticket not found.", 404);
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: ticketInclude,
  });

  if (!ticket) {
    throw new AppError("Ticket not found.", 404);
  }

  response.status(200).json({ success: true, data: ticket });
}

export async function getTicketSummary(_request: Request, response: Response): Promise<void> {
  const [total, byStatus, critical, recent] = await prisma.$transaction([
    prisma.ticket.count(),
    prisma.ticket.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.ticket.count({ where: { priority: TicketPriority.CRITICAL } }),
    prisma.ticket.findMany({ include: ticketInclude, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);
  const statuses = Object.fromEntries(byStatus.map((entry) => [entry.status, entry._count._all]));
  response.status(200).json({
    success: true,
    data: {
      total,
      open: statuses[TicketStatus.OPEN] ?? 0,
      inProgress: statuses[TicketStatus.IN_PROGRESS] ?? 0,
      resolved: statuses[TicketStatus.RESOLVED] ?? 0,
      closed: statuses[TicketStatus.CLOSED] ?? 0,
      critical,
      recent,
    },
  });
}

export async function getTicketFormOptions(_request: Request, response: Response): Promise<void> {
  const [projects, users] = await prisma.$transaction([
    prisma.project.findMany({ select: { id: true, key: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
  ]);
  response.status(200).json({ success: true, data: { projects, users } });
}

export async function createTicket(request: Request, response: Response): Promise<void> {
  const title = readOptionalString(request.body.title);
  const projectId = readOptionalString(request.body.projectId);
  const creatorId = readOptionalString(request.body.creatorId);
  const description = readOptionalString(request.body.description);
  const assigneeId = readOptionalString(request.body.assigneeId);
  const status = request.body.status ?? TicketStatus.OPEN;
  const priority = request.body.priority ?? TicketPriority.MEDIUM;

  if (!title || !projectId || !creatorId) {
    throw new AppError("title, projectId, and creatorId are required.", 400);
  }
  if (!isEnumValue(TicketStatus, status) || !isEnumValue(TicketPriority, priority)) {
    throw new AppError("status or priority is invalid.", 400);
  }

  const [project, creator] = await prisma.$transaction([
    prisma.project.findUnique({ where: { id: projectId }, select: { id: true, key: true } }),
    prisma.user.findUnique({ where: { id: creatorId }, select: { id: true } }),
  ]);
  const assignee = assigneeId
    ? await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true } })
    : null;
  if (!project || !creator || (assigneeId && !assignee)) {
    throw new AppError("The selected project, creator, or assignee was not found.", 400);
  }

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: `${project.key}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      title,
      description,
      projectId,
      creatorId,
      assigneeId: assigneeId ?? null,
      status,
      priority,
    },
    include: ticketInclude,
  });
  response.status(201).json({ success: true, data: ticket });
}
