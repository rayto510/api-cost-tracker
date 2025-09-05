// tests/alerts.test.ts
import { buildServer } from "../src/server";
// import { alerts as alertsStore } from "../src/services/alertsService";
import { alerts as alertsStore } from "../src/services/alertsService";

let app: ReturnType<typeof buildServer>;
let integrationId: string;

beforeAll(async () => {
  app = buildServer();
  await app.ready();

  // Create a single integration for alert tests
  const res = await app.inject({
    method: "POST",
    url: "/integrations",
    payload: { name: "Test API", type: "openai", apiKey: "sk-test" },
  });
  integrationId = res.json().id;
});

afterAll(async () => {
  await app.close();
});

// Reset only alerts before each test, keep integration
beforeEach(() => {
  Object.keys(alertsStore).forEach((key) => delete alertsStore[key]);
});

describe("Alerts endpoints", () => {
  let alertId: string;

  // --- Positive / happy path tests ---
  it("creates an alert", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/alerts",
      payload: {
        integrationId,
        threshold: 100,
        type: "cost",
        notificationMethod: "email",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.threshold).toBe(100);
    alertId = body.id;
  });

  it("retrieves an alert", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: "/alerts",
      payload: {
        integrationId,
        threshold: 50,
        type: "usage",
        notificationMethod: "slack",
      },
    });
    alertId = createRes.json().id;

    const res = await app.inject({ method: "GET", url: `/alerts/${alertId}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(alertId);
  });

  it("updates an alert", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: "/alerts",
      payload: {
        integrationId,
        threshold: 80,
        type: "cost",
        notificationMethod: "email",
      },
    });
    alertId = createRes.json().id;

    const res = await app.inject({
      method: "PUT",
      url: `/alerts/${alertId}`,
      payload: { threshold: 120, notificationMethod: "slack" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().threshold).toBe(120);
    expect(res.json().notificationMethod).toBe("slack");
  });

  it("deletes an alert", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: "/alerts",
      payload: {
        integrationId,
        threshold: 30,
        type: "usage",
        notificationMethod: "email",
      },
    });
    alertId = createRes.json().id;

    const res = await app.inject({
      method: "DELETE",
      url: `/alerts/${alertId}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().message).toBe("Alert deleted");
  });

  // --- Negative / error path tests ---
  it("returns 404 when creating alert for non-existent integration", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/alerts",
      payload: {
        integrationId: "nonexistent-integration",
        threshold: 100,
        type: "cost",
        notificationMethod: "email",
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().message).toBe("Integration does not exist");
  });

  it("returns 404 when retrieving non-existent alert", async () => {
    const res = await app.inject({ method: "GET", url: "/alerts/nonexistent" });
    expect(res.statusCode).toBe(404);
    expect(res.json().message).toBe("Alert not found");
  });

  it("returns 404 when updating non-existent alert", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/alerts/nonexistent",
      payload: { threshold: 200, notificationMethod: "slack" },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().message).toBe("Alert not found");
  });

  it("returns 404 when deleting non-existent alert", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/alerts/nonexistent",
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().message).toBe("Alert not found");
  });

  it("triggers alert when usage exceeds threshold", async () => {
    // Create an alert with low threshold
    const createRes = await app.inject({
      method: "POST",
      url: "/alerts",
      payload: {
        integrationId,
        threshold: 50,
        type: "usage",
        notificationMethod: "email",
      },
    });
    const alertId = createRes.json().id;

    // Record usage that exceeds threshold
    await app.inject({
      method: "POST",
      url: `/usage/${integrationId}`,
      payload: { date: "2025-09-04", usage: 60, cost: 10 },
    });

    // Retrieve alert to check if triggered
    const res = await app.inject({ method: "GET", url: `/alerts/${alertId}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().triggered).toBe(true);
  });
});
