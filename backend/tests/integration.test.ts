// tests/integration.test.ts
import { buildServer } from "../src/server";
import {
  // Reset in-memory store if needed
  integrations as integrationStore,
} from "../src/services/integrationService.effect";

let app: ReturnType<typeof buildServer>;

beforeAll(async () => {
  app = buildServer();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// Optional: reset in-memory integrations before each test
beforeEach(() => {
  Object.keys(integrationStore).forEach((key) => delete integrationStore[key]);
});

describe("Integration endpoints", () => {
  let integrationId: string;

  it("creates an integration", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/integrations",
      payload: { name: "OpenAI API", type: "openai", apiKey: "sk-xxxx" },
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
    const createResponse = await app.inject({
      method: "POST",
      url: "/integrations",
      payload: { name: "OpenAI API", type: "openai", apiKey: "sk-xxxx" },
    });
    integrationId = createResponse.json().id;

    const response = await app.inject({
      method: "GET",
      url: `/integrations/${integrationId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().id).toBe(integrationId);
  });

  it("updates an integration", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/integrations",
      payload: { name: "OpenAI API", type: "openai", apiKey: "sk-xxxx" },
    });
    integrationId = createResponse.json().id;

    const response = await app.inject({
      method: "PUT",
      url: `/integrations/${integrationId}`,
      payload: { name: "OpenAI Updated", apiKey: "sk-updated" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().name).toBe("OpenAI Updated");
    expect(response.json().apiKey).toBe("sk-updated");
  });

  it("lists all integrations", async () => {
    await app.inject({
      method: "POST",
      url: "/integrations",
      payload: { name: "OpenAI API", type: "openai", apiKey: "sk-xxxx" },
    });

    const response = await app.inject({ method: "GET", url: "/integrations" });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBeGreaterThan(0);
  });

  it("deletes an integration", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/integrations",
      payload: { name: "OpenAI API", type: "openai", apiKey: "sk-xxxx" },
    });
    integrationId = createResponse.json().id;

    const response = await app.inject({
      method: "DELETE",
      url: `/integrations/${integrationId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toBe("Integration deleted");
  });

  it("returns 404 for deleted integration", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/integrations",
      payload: { name: "OpenAI API", type: "openai", apiKey: "sk-xxxx" },
    });
    integrationId = createResponse.json().id;

    await app.inject({
      method: "DELETE",
      url: `/integrations/${integrationId}`,
    });

    const response = await app.inject({
      method: "GET",
      url: `/integrations/${integrationId}`,
    });

    expect(response.statusCode).toBe(404);
  });

  // --- Negative / error cases ---

  it("returns 404 when retrieving non-existent integration", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/integrations/nonexistent",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ message: "Integration not found" });
  });

  it("returns 404 when updating non-existent integration", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/integrations/nonexistent",
      payload: { name: "Does Not Exist" },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ message: "Integration not found" });
  });

  it("returns 404 when deleting non-existent integration", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/integrations/nonexistent",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ message: "Integration not found" });
  });

  it("creates integration with invalid payload (no validation, returns 200)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/integrations",
      payload: { invalidField: "oops" },
    });

    // No schema validation is enabled, so Fastify accepts it
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.invalidField).toBe("oops");
  });
});
