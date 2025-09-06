// tests/integration.test.ts
import { buildServer } from "../src/server";
import { prisma } from "../src/db/db";
import * as Effect from "@effect/io/Effect";
import { pipe } from "@effect/data/Function";

let app: ReturnType<typeof buildServer>;

// Mock user for testing
const TEST_USER_ID = "test-user-123";

beforeAll(async () => {
  // Build server with a preHandler to mock authentication
  app = buildServer();

  // Mock auth: attach userId from headers to req.user
  app.addHook("preHandler", (req, _reply, done) => {
    const userId = req.headers["x-user-id"] as string;
    if (userId) {
      (req as any).user = { id: userId };
    }
    done();
  });

  await app.ready();

  // Ensure test user exists
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: {
      id: TEST_USER_ID,
      name: "Test User",
      email: "test@example.com",
      passwordHash: "hashedpassword",
    },
  });
});

afterAll(async () => {
  // Clean up test data
  await prisma.integration.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
  await app.close();
});

describe("Integration endpoints", () => {
  let integrationId: string;

  it("creates an integration", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/integrations",
      payload: { name: "OpenAI API", type: "openai", apiKey: "sk-xxxx" },
      headers: { "x-user-id": TEST_USER_ID },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.name).toBe("OpenAI API");
    expect(body.type).toBe("openai");
    expect(body.apiKey).toBe("sk-xxxx");
    expect(body.id).toBeDefined();

    integrationId = body.id;
  });

  it("retrieves an integration", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/integrations/${integrationId}`,
      headers: { "x-user-id": TEST_USER_ID },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.id).toBe(integrationId);
  });

  it("updates an integration", async () => {
    const response = await app.inject({
      method: "PUT",
      url: `/integrations/${integrationId}`,
      payload: { name: "OpenAI Updated", apiKey: "sk-updated" },
      headers: { "x-user-id": TEST_USER_ID },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.name).toBe("OpenAI Updated");
    expect(body.apiKey).toBe("sk-updated");
  });

  it("lists all integrations", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/integrations",
      headers: { "x-user-id": TEST_USER_ID },
    });

    expect(response.statusCode).toBe(200);
    const list = response.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it("deletes an integration", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/integrations/${integrationId}`,
      headers: { "x-user-id": TEST_USER_ID },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toBe("Integration deleted");
  });

  it("returns 404 for deleted integration", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/integrations/${integrationId}`,
      headers: { "x-user-id": TEST_USER_ID },
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 404 for non-existent integration", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/integrations/nonexistent",
      headers: { "x-user-id": TEST_USER_ID },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ message: "Integration not found" });
  });
});
