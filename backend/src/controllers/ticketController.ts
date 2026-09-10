import type { Prisma } from "@prisma/client";
import { TicketPriority, TicketStatus } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const ticketInclude = {
  project: { select: { id: true, key: true, name: true } },
  creator: { select: { id: true, firstName: true, lastName: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
} as const;

const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "priority", "status", "ticketNumber"] as const;
type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

function isEnumValue<T extends Record<string, string>>(enumObject: T, value: unknown): value is T[keyof T] {
  return typeof value === "string" && Object.values(enumObject).includes(value);
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function listTickets(request: Request, response: Response): Promise<void> {
  const {
    search,
    status,
    priority,
    assigneeId,
    projectId,
    page: rawPage,
    limit: rawLimit,
    sortBy: rawSortBy,
    sortOrder: rawSortOrder,
  } = request.query;

  const where: Prisma.TicketWhereInput = {};

  if (status !== undefined) {
    if (!isEnumValue(TicketStatus, status)) {
      throw new AppError("Invalid status filter.", 400);
    }
    where.status = status;
  }

  if (priority !== undefined) {
    if (!isEnumValue(TicketPriority, priority)) {
      throw new AppError("Invalid priority filter.", 400);
    }
    where.priority = priority;
  }

  if (typeof assigneeId === "string" && assigneeId.trim()) {
    where.assigneeId = assigneeId.trim();
  }

  if (typeof projectId === "string" && projectId.trim()) {
    where.projectId = projectId.trim();
  }

  if (typeof search === "string" && search.trim()) {
    const term = search.trim();
    where.OR = [
      { ticketNumber: { contains: term, mode: "insensitive" } },
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }

  let page = 1;
  if (rawPage !== undefined) {
    const parsedPage = Number(rawPage);
    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      throw new AppError("page must be an integer greater than or equal to 1.", 400);
    }
    page = parsedPage;
  }

  let limit = 10;
  if (rawLimit !== undefined) {
    const parsedLimit = Number(rawLimit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new AppError("limit must be an integer between 1 and 100.", 400);
    }
    limit = parsedLimit;
  }

  let sortBy: SortField = "createdAt";
  if (rawSortBy !== undefined) {
    if (typeof rawSortBy !== "string" || !ALLOWED_SORT_FIELDS.includes(rawSortBy as SortField)) {
      throw new AppError(`sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}.`, 400);
    }
    sortBy = rawSortBy as SortField;
  }

  let sortOrder: "asc" | "desc" = "desc";
  if (rawSortOrder !== undefined) {
    if (typeof rawSortOrder !== "string" || (rawSortOrder !== "asc" && rawSortOrder !== "desc")) {
      throw new AppError("sortOrder must be 'asc' or 'desc'.", 400);
    }
    sortOrder = rawSortOrder;
  }

  const skip = (page - 1) * limit;

  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  response.status(200).json({
    success: true,
    data: tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
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

export async function updateTicket(request: Request, response: Response): Promise<void> {
  const ticketId = request.params.id;
  if (!ticketId || Array.isArray(ticketId)) {
    throw new AppError("Ticket not found.", 404);
  }

  const existingTicket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });

  if (!existingTicket) {
    throw new AppError("Ticket not found.", 404);
  }

  const { title, description, status, priority, assigneeId } = request.body ?? {};

  const updateData: {
    title?: string;
    description?: string | null;
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: string | null;
  } = {};

  if (title !== undefined) {
    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    if (!trimmedTitle) {
      throw new AppError("title cannot be empty.", 400);
    }
    updateData.title = trimmedTitle;
  }

  if (description !== undefined) {
    updateData.description = typeof description === "string" && description.trim() ? description.trim() : null;
  }

  if (status !== undefined) {
    if (!isEnumValue(TicketStatus, status)) {
      throw new AppError("status is invalid.", 400);
    }
    updateData.status = status;
  }

  if (priority !== undefined) {
    if (!isEnumValue(TicketPriority, priority)) {
      throw new AppError("priority is invalid.", 400);
    }
    updateData.priority = priority;
  }

  if (assigneeId !== undefined) {
    const trimmedAssigneeId = typeof assigneeId === "string" && assigneeId.trim() ? assigneeId.trim() : null;
    if (trimmedAssigneeId) {
      const assigneeExists = await prisma.user.findUnique({
        where: { id: trimmedAssigneeId },
        select: { id: true },
      });
      if (!assigneeExists) {
        throw new AppError("The selected assignee was not found.", 400);
      }
      updateData.assigneeId = trimmedAssigneeId;
    } else {
      updateData.assigneeId = null;
    }
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: updateData,
    include: ticketInclude,
  });

  response.status(200).json({ success: true, data: updatedTicket });
}

