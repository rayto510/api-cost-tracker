// tests/userAuth.test.ts
import { buildServer } from "../src/server";

let app: ReturnType<typeof buildServer>;

beforeAll(async () => {
  app = buildServer();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("User endpoints", () => {
  let userId: string;

  it("creates a new user", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "Alice",
        email: "alice@test.com",
        password: "password123",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe("Alice");
    expect(body.email).toBe("alice@test.com");

    userId = body.id;
  });

  it("fails to create user with missing fields", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/users",
      payload: { name: "Bob" }, // missing email and password
    });
    expect([400, 422]).toContain(res.statusCode);
  });

  it("retrieves a user by id", async () => {
    const res = await app.inject({ method: "GET", url: `/users/${userId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(userId);
    expect(body.name).toBe("Alice");
  });

  it("returns 404 for unknown user", async () => {
    const res = await app.inject({ method: "GET", url: "/users/nonexistent" });
    expect(res.statusCode).toBe(404);
  });

  it("updates a user", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/users/${userId}`,
      payload: { name: "Alice Updated" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.name).toBe("Alice Updated");
  });

  it("deletes a user", async () => {
    const res = await app.inject({ method: "DELETE", url: `/users/${userId}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().message).toBe("User deleted");
  });

  it("returns 404 for deleted user", async () => {
    const res = await app.inject({ method: "GET", url: `/users/${userId}` });
    expect(res.statusCode).toBe(404);
  });
});

describe("Auth endpoints", () => {
  let userId: string;
  let token: string;
  let refreshToken: string;

  beforeAll(async () => {
    const res = await app.inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "AuthUser",
        email: "auth@test.com",
        password: "pass123",
      },
    });
    userId = res.json().id;
  });

  it("logs in a user with correct credentials", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "auth@test.com", password: "pass123" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    token = body.token;
    refreshToken = body.refreshToken;
  });

  it("fails login with wrong password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "auth@test.com", password: "wrong" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("refreshes JWT token with valid refresh token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().token).toBeDefined();
  });

  it("fails to refresh with invalid token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: "invalid" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("logs out a user", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: { token },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().message).toBe("Logged out");
  });
});
