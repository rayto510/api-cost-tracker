// tests/usage.test.ts
import { buildServer } from "../src/server";

let app: ReturnType<typeof buildServer>;

beforeAll(async () => {
  app = buildServer();
  await app.ready();
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

describe("Usage endpoints", () => {
  let integrationId: string;

  // Create a fresh integration for usage tests
  beforeAll(async () => {
    const res = await app.inject({
      method: "POST",
      url: "/integrations",
      payload: { name: "Test API", type: "openai", apiKey: "sk-test" },
    });

    integrationId = res.json().id;
  });

  it("records usage", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/usage/${integrationId}`,
      payload: { date: "2025-09-03", usage: 100, cost: 10 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: "Usage recorded" });
  });

  it("retrieves usage", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/usage/${integrationId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      { date: "2025-09-03", usage: 100, cost: 10 },
    ]);
  });

  it("retrieves usage in a date range", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/usage/${integrationId}/range?start=2025-09-01&end=2025-09-30`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      { date: "2025-09-03", usage: 100, cost: 10 },
    ]);
  });

  it("updates a usage entry", async () => {
    const response = await app.inject({
      method: "PUT",
      url: `/usage/${integrationId}/0`, // index 0
      payload: { usage: 150, cost: 15 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      date: "2025-09-03",
      usage: 150,
      cost: 15,
    });
  });

  it("deletes a usage entry", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/usage/${integrationId}/0`, // index 0
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      date: "2025-09-03",
      usage: 150,
      cost: 15,
    });

    // Confirm it's deleted
    const getResponse = await app.inject({
      method: "GET",
      url: `/usage/${integrationId}`,
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toEqual([]);
  });

  // --- Error cases ---
  it("returns 404 when recording usage for non-existent integration", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/usage/nonexistent`,
      payload: { date: "2025-09-03", usage: 50, cost: 5 },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ message: "Integration does not exist" });
  });

  it("returns 404 when updating non-existent usage entry", async () => {
    const response = await app.inject({
      method: "PUT",
      url: `/usage/${integrationId}/999`, // invalid index
      payload: { usage: 200 },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ message: "Usage entry not found" });
  });

  it("returns 404 when deleting non-existent usage entry", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/usage/${integrationId}/999`, // invalid index
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ message: "Usage entry not found" });
  });
});
