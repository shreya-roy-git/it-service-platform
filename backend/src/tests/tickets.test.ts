import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("Ticket APIs — Unauthenticated Requests (TASK 4 & TASK 7)", () => {
  it("returns 401 Unauthorized for GET /api/tickets without auth token", async () => {
    const response = await request(app).get("/api/tickets");
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("returns 401 Unauthorized for GET /api/tickets/summary without auth token", async () => {
    const response = await request(app).get("/api/tickets/summary");
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("returns 401 Unauthorized for GET /api/tickets/form-options without auth token", async () => {
    const response = await request(app).get("/api/tickets/form-options");
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("returns 401 Unauthorized for POST /api/tickets without auth token", async () => {
    const response = await request(app).post("/api/tickets").send({
      title: "Test Ticket",
    });
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe("Ticket APIs — Authenticated Endpoints (TASK 4, TASK 5, TASK 7)", () => {
  let adminToken: string;
  let analystToken: string;
  let defaultProjectId: string;
  let defaultCreatorId: string;
  let createdTicketId: string;

  beforeAll(async () => {
    // Authenticate as Administrator
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "manager@example.test", password: "Manager@123" });
    adminToken = adminLogin.body.data.token;

    // Authenticate as Service Desk Analyst
    const analystLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "analyst@example.test", password: "Analyst@123" });
    analystToken = analystLogin.body.data.token;

    // Fetch form options to get valid project and user IDs for ticket creation
    const formOptions = await request(app)
      .get("/api/tickets/form-options")
      .set("Authorization", `Bearer ${adminToken}`);
    defaultProjectId = formOptions.body.data.projects[0].id;
    defaultCreatorId = formOptions.body.data.users[0].id;
  });

  it("GET /api/tickets — returns tickets list and pagination for Administrator", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(10);
    expect(typeof response.body.pagination.total).toBe("number");
  });

  it("GET /api/tickets — returns tickets list for Service Desk Analyst (TASK 7 Analyst RBAC)", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .set("Authorization", `Bearer ${analystToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("GET /api/tickets/summary — returns metrics overview", async () => {
    const response = await request(app)
      .get("/api/tickets/summary")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data.total).toBe("number");
    expect(typeof response.body.data.open).toBe("number");
    expect(typeof response.body.data.inProgress).toBe("number");
    expect(typeof response.body.data.resolved).toBe("number");
    expect(typeof response.body.data.closed).toBe("number");
    expect(typeof response.body.data.critical).toBe("number");
    expect(Array.isArray(response.body.data.recent)).toBe(true);
  });

  it("GET /api/tickets/form-options — returns projects and users dropdown lists", async () => {
    const response = await request(app)
      .get("/api/tickets/form-options")
      .set("Authorization", `Bearer ${analystToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.projects)).toBe(true);
    expect(Array.isArray(response.body.data.users)).toBe(true);
  });

  it("POST /api/tickets — creates a new ticket with valid payload", async () => {
    const uniqueTitle = `[Backend Test ${Date.now()}] Network Issue`;
    const response = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: uniqueTitle,
        description: "Automated ticket created during Vitest suite run.",
        projectId: defaultProjectId,
        creatorId: defaultCreatorId,
        priority: "HIGH",
        status: "OPEN",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.title).toBe(uniqueTitle);
    expect(response.body.data.priority).toBe("HIGH");
    expect(response.body.data.status).toBe("OPEN");
    expect(response.body.data.ticketNumber).toBeDefined();

    createdTicketId = response.body.data.id;
  });

  it("GET /api/tickets/:id — fetches specific ticket by ID", async () => {
    expect(createdTicketId).toBeDefined();

    const response = await request(app)
      .get(`/api/tickets/${createdTicketId}`)
      .set("Authorization", `Bearer ${analystToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(createdTicketId);
  });

  it("PATCH /api/tickets/:id — updates ticket status and priority", async () => {
    expect(createdTicketId).toBeDefined();

    const response = await request(app)
      .patch(`/api/tickets/${createdTicketId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "IN_PROGRESS",
        priority: "CRITICAL",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("IN_PROGRESS");
    expect(response.body.data.priority).toBe("CRITICAL");
  });

  it("GET /api/tickets/:id — returns 404 for non-existent ticket ID", async () => {
    const response = await request(app)
      .get("/api/tickets/non-existent-ticket-id-99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/ticket not found/i);
  });
});

describe("Ticket Validation (TASK 6)", () => {
  let adminToken: string;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "manager@example.test", password: "Manager@123" });
    adminToken = adminLogin.body.data.token;
  });

  it("rejects ticket creation when required fields (title, projectId, creatorId) are missing", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Incomplete Ticket" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/title, projectId, and creatorId are required/i);
  });

  it("rejects ticket creation with invalid status or priority enum values", async () => {
    const formOptions = await request(app)
      .get("/api/tickets/form-options")
      .set("Authorization", `Bearer ${adminToken}`);
    const projectId = formOptions.body.data.projects[0].id;
    const creatorId = formOptions.body.data.users[0].id;

    const response = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bad Status Ticket",
        projectId,
        creatorId,
        status: "INVALID_STATUS",
        priority: "INVALID_PRIORITY",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/status or priority is invalid/i);
  });

  it("rejects ticket creation when referenced project or creator ID does not exist", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bad Reference Ticket",
        projectId: "non-existent-project-id",
        creatorId: "non-existent-user-id",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/project, creator, or assignee was not found/i);
  });

  it("rejects ticket update with empty title", async () => {
    const listRes = await request(app)
      .get("/api/tickets")
      .set("Authorization", `Bearer ${adminToken}`);
    const ticketId = listRes.body.data[0].id;

    const response = await request(app)
      .patch(`/api/tickets/${ticketId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "   " });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/title cannot be empty/i);
  });
});
