import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("Error Handling — Unknown Routes (TASK 11)", () => {
  it("returns 404 for an unknown GET route", async () => {
    const response = await request(app).get("/api/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/was not found/i);
    expect(response.body.stack).toBeUndefined();
  });

  it("returns 404 for an unknown POST route", async () => {
    const response = await request(app).post("/api/unknown-endpoint").send({});

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/was not found/i);
    expect(response.body.stack).toBeUndefined();
  });
});
