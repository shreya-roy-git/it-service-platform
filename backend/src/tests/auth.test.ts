import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("Authentication API — POST /api/auth/login", () => {
  it("authenticates successfully with valid Administrator credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "manager@example.test",
        password: "Manager@123",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.token).toBeTypeOf("string");
    expect(response.body.data.token.length).toBeGreaterThan(0);

    const user = response.body.data.user;
    expect(user).toBeDefined();
    expect(user.email).toBe("manager@example.test");
    expect(user.firstName).toBe("Morgan");
    expect(user.lastName).toBe("Reed");
    expect(user.role).toBeDefined();
    expect(user.role.name).toBe("Administrator");

    // Ensure sensitive credential fields are NOT exposed
    expect(user.password).toBeUndefined();
    expect(user.passwordHash).toBeUndefined();
  });

  it("authenticates successfully with valid Service Desk Analyst credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "analyst@example.test",
        password: "Analyst@123",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeTypeOf("string");
    expect(response.body.data.user.email).toBe("analyst@example.test");
    expect(response.body.data.user.role.name).toBe("Service Desk Analyst");
  });

  it("rejects login with invalid password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "manager@example.test",
        password: "WrongPassword123",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/invalid credentials/i);

    // Verify token and password are not returned
    expect(response.body.token).toBeUndefined();
    expect(response.body.password).toBeUndefined();
  });

  it("rejects login with non-existent email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrong@example.test",
        password: "WrongPassword123",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.token).toBeUndefined();
  });

  it("rejects login when email or password is missing", async () => {
    const responseNoPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: "manager@example.test" });

    expect(responseNoPassword.status).toBe(400);
    expect(responseNoPassword.body.success).toBe(false);
    expect(responseNoPassword.body.message).toMatch(/required/i);

    const responseNoEmail = await request(app)
      .post("/api/auth/login")
      .send({ password: "Manager@123" });

    expect(responseNoEmail.status).toBe(400);
    expect(responseNoEmail.body.success).toBe(false);
  });
});

describe("Current User API — GET /api/auth/me", () => {
  it("returns 401 Unauthorized when requested without JWT token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("returns authenticated user info when valid JWT token is provided", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "manager@example.test",
        password: "Manager@123",
      });

    const token = loginRes.body.data.token;

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe("manager@example.test");
  });
});

describe("Logout API — POST /api/auth/logout", () => {
  it("returns 401 Unauthorized when requested without auth token", async () => {
    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("returns 200 OK with logout acknowledgment when authenticated", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "manager@example.test",
        password: "Manager@123",
      });

    const token = loginRes.body.data.token;

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/logged out/i);
  });
});
