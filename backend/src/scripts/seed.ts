import { TicketPriority, TicketStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";

async function seed(): Promise<void> {
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

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.test" },
    update: { firstName: "Morgan", lastName: "Reed", roleId: administratorRole.id },
    create: { email: "manager@example.test", firstName: "Morgan", lastName: "Reed", roleId: administratorRole.id },
  });
  const analyst = await prisma.user.upsert({
    where: { email: "analyst@example.test" },
    update: { firstName: "Avery", lastName: "Shah", roleId: analystRole.id },
    create: { email: "analyst@example.test", firstName: "Avery", lastName: "Shah", roleId: analystRole.id },
  });

  const project = await prisma.project.upsert({
    where: { key: "ITOPS" },
    update: { name: "IT Operations", description: "Internal IT service management", ownerId: manager.id },
    create: { key: "ITOPS", name: "IT Operations", description: "Internal IT service management", ownerId: manager.id },
  });

  await prisma.ticket.upsert({
    where: { ticketNumber: "ITOPS-1001" },
    update: { title: "VPN access unavailable", status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH, projectId: project.id, creatorId: manager.id, assigneeId: analyst.id },
    create: { ticketNumber: "ITOPS-1001", title: "VPN access unavailable", description: "Remote users cannot connect to the corporate VPN.", status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH, projectId: project.id, creatorId: manager.id, assigneeId: analyst.id },
  });
  await prisma.ticket.upsert({
    where: { ticketNumber: "ITOPS-1002" },
    update: { title: "Email delivery delays", status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, projectId: project.id, creatorId: manager.id, assigneeId: null },
    create: { ticketNumber: "ITOPS-1002", title: "Email delivery delays", description: "Delivery delays reported by the APAC office.", status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, projectId: project.id, creatorId: manager.id },
  });

  console.info("Development database seed completed.");
}

seed()
  .catch(async (error: unknown) => {
    console.error("Development database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
