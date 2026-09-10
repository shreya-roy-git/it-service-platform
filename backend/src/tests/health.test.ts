import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("Health API — GET /api/health", () => {
  it("returns 200 OK and existing success response structure", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "API is running",
    });
  });
});
