import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("User Management — Administrator Access (TASK 8)", () => {
  let adminToken: string;
  let createdUserId: string;
  let createdUserEmail: string;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "manager@example.test", password: "Manager@123" });
    adminToken = adminLogin.body.data.token;
  });

  it("GET /api/users — lists users for Administrator", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);

    const firstUser = response.body.data[0];
    expect(firstUser.id).toBeDefined();
    expect(firstUser.email).toBeDefined();
    expect(firstUser.role).toBeDefined();
    expect(firstUser.password).toBeUndefined();
    expect(firstUser.passwordHash).toBeUndefined();
  });

  it("POST /api/users — creates a new user with unique test data", async () => {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    createdUserEmail = `backend-user-${uniqueId}@example.test`;

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "TestFirst",
        lastName: "TestLast",
        email: createdUserEmail,
        password: "TestPassword123!",
        role: "Service Desk Analyst",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.email).toBe(createdUserEmail);
    expect(response.body.data.firstName).toBe("TestFirst");
    expect(response.body.data.lastName).toBe("TestLast");
    expect(response.body.data.role).toBe("Service Desk Analyst");

    createdUserId = response.body.data.id;
  });

  it("GET /api/users/:id — retrieves specific user by ID", async () => {
    expect(createdUserId).toBeDefined();

    const response = await request(app)
      .get(`/api/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(createdUserId);
    expect(response.body.data.email).toBe(createdUserEmail);
  });

  it("PATCH /api/users/:id — updates user details (lastName)", async () => {
    expect(createdUserId).toBeDefined();

    const updatedLastName = "UpdatedLastName";
    const response = await request(app)
      .patch(`/api/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        lastName: updatedLastName,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(createdUserId);
    expect(response.body.data.lastName).toBe(updatedLastName);
  });
});

describe("User Management — Analyst RBAC Protection (TASK 9)", () => {
  let analystToken: string;

  beforeAll(async () => {
    const analystLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "analyst@example.test", password: "Analyst@123" });
    analystToken = analystLogin.body.data.token;
  });

  it("GET /api/users — denies Analyst access with 403 Forbidden", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${analystToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/administrator permissions are required|permission|denied/i);
  });

  it("POST /api/users — denies Analyst user creation with 403 Forbidden", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${analystToken}`)
      .send({
        firstName: "AnalystCreated",
        lastName: "User",
        email: `forbidden-${Date.now()}@example.test`,
        password: "Password123!",
        role: "Service Desk Analyst",
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("GET /api/users/:id — denies Analyst user detail retrieval with 403 Forbidden", async () => {
    const response = await request(app)
      .get("/api/users/some-user-id")
      .set("Authorization", `Bearer ${analystToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("PATCH /api/users/:id — denies Analyst user modification with 403 Forbidden", async () => {
    const response = await request(app)
      .patch("/api/users/some-user-id")
      .set("Authorization", `Bearer ${analystToken}`)
      .send({ lastName: "ForbiddenUpdate" });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});

describe("User Management — Validation & Error Handling (TASK 10)", () => {
  let adminToken: string;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "manager@example.test", password: "Manager@123" });
    adminToken = adminLogin.body.data.token;
  });

  it("rejects user creation with missing required fields", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Incomplete",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/required/i);
  });

  it("rejects user creation with duplicate email address", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Duplicate",
        lastName: "User",
        email: "manager@example.test", // Seed email already exists
        password: "Password123!",
        role: "Service Desk Analyst",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/already exists/i);
  });

  it("rejects user creation with unsupported role", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "BadRole",
        lastName: "User",
        email: `badrole-${Date.now()}@example.test`,
        password: "Password123!",
        role: "SuperGlobalAdmin",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/invalid role/i);
  });

  it("returns 404 for non-existent user ID on GET /api/users/:id", async () => {
    const response = await request(app)
      .get("/api/users/non-existent-user-id-99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/user not found/i);
  });

  it("returns 404 for non-existent user ID on PATCH /api/users/:id", async () => {
    const response = await request(app)
      .patch("/api/users/non-existent-user-id-99999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ lastName: "NewName" });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/user not found/i);
  });
});
