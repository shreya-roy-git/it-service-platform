import { beforeAll } from "vitest";
import { TicketPriority, TicketStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";

export async function ensureSeeded(): Promise<void> {
  const administratorRole = await prisma.role.upsert({
    where: { name: "Administrator" },
    update: { description: "Platform administrator" },
    create: { name: "Administrator", description: "Platform administrator" },
  });

  const analystRole = await prisma.role.upsert({
    where: { name: "Service Desk Analyst" },
    update: { description: "Handles incidents and service requests" },
    create: { name: "Service Desk Analyst", description: "Handles incidents and service requests" },
  });

  const managerPasswordHash = await bcrypt.hash("Manager@123", 10);
  const analystPasswordHash = await bcrypt.hash("Analyst@123", 10);

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.test" },
    update: { firstName: "Morgan", lastName: "Reed", roleId: administratorRole.id, passwordHash: managerPasswordHash },
    create: { email: "manager@example.test", firstName: "Morgan", lastName: "Reed", roleId: administratorRole.id, passwordHash: managerPasswordHash },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@example.test" },
    update: { firstName: "Avery", lastName: "Shah", roleId: analystRole.id, passwordHash: analystPasswordHash },
    create: { email: "analyst@example.test", firstName: "Avery", lastName: "Shah", roleId: analystRole.id, passwordHash: analystPasswordHash },
  });

  const project = await prisma.project.upsert({
    where: { key: "ITOPS" },
    update: { name: "IT Operations", description: "Internal IT service management", ownerId: manager.id },
    create: { key: "ITOPS", name: "IT Operations", description: "Internal IT service management", ownerId: manager.id },
  });

  await prisma.ticket.upsert({
    where: { ticketNumber: "ITOPS-1001" },
    update: { title: "VPN access unavailable", status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH, projectId: project.id, creatorId: manager.id, assigneeId: analyst.id },
    create: { ticketNumber: "ITOPS-1001", title: "VPN access unavailable", description: "Remote users cannot connect to corporate VPN.", status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH, projectId: project.id, creatorId: manager.id, assigneeId: analyst.id },
  });
}

beforeAll(async () => {
  await ensureSeeded();
});
