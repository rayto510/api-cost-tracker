// src/server.ts
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect"; // ✅ correct import

import {
  addIntegrationEffect,
  getIntegrationEffect,
  updateIntegrationEffect,
  deleteIntegrationEffect,
  listIntegrationsEffect,
  Integration,
} from "./services/integrationService.effect";

import {
  recordUsageValidatedEffect,
  getUsageEffect,
  getUsageRangeEffect,
  updateUsageEffect,
  deleteUsageEffect,
  UsageEntry,
} from "./services/usageService.effect";

import {
  getAlertEffect,
  createAlertEffect,
  updateAlertEffect,
  deleteAlertEffect,
  Alert,
} from "./services/alertsService.effect";

import {
  createUserEffect,
  getUserEffect,
  updateUserEffect,
  deleteUserEffect,
  authenticateUserEffect,
  User,
} from "./services/userService.effect";

import {
  signTokenEffect,
  signRefreshTokenEffect,
  verifyRefreshTokenEffect,
} from "./services/authService.effect";

export function buildServer() {
  const app = Fastify();

  // --- Integrations Routes ---
  app.post(
    "/integrations",
    async (
      req: FastifyRequest<{ Body: Omit<Integration, "id"> }>,
      reply: FastifyReply
    ) => {
      const result = await pipe(
        addIntegrationEffect(req.body),
        Effect.runPromise
      );
      reply.send(result);
    }
  );

  app.get(
    "/integrations/:id",
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const integration = await pipe(
        getIntegrationEffect(req.params.id),
        Effect.runPromise
      );
      if (!integration)
        return reply.status(404).send({ message: "Integration not found" });
      reply.send(integration);
    }
  );

  app.put(
    "/integrations/:id",
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: Omit<Integration, "id">;
      }>,
      reply: FastifyReply
    ) => {
      const updated = await pipe(
        updateIntegrationEffect(req.params.id, req.body),
        Effect.runPromise
      );
      if (!updated)
        return reply.status(404).send({ message: "Integration not found" });
      reply.send(updated);
    }
  );

  app.delete(
    "/integrations/:id",
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const deleted = await pipe(
        deleteIntegrationEffect(req.params.id),
        Effect.runPromise
      );
      if (!deleted)
        return reply.status(404).send({ message: "Integration not found" });
      reply.send(deleted);
    }
  );

  app.get("/integrations", async (req, reply) => {
    const list = await pipe(listIntegrationsEffect, Effect.runPromise);
    reply.send(list);
  });

  // --- Usage Routes ---
  app.post(
    "/usage/:integrationId",
    async (
      req: FastifyRequest<{
        Params: { integrationId: string };
        Body: UsageEntry;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const result = await pipe(
          recordUsageValidatedEffect(req.params.integrationId, req.body),
          Effect.runPromise
        );
        reply.send(result);
      } catch (err: any) {
        reply.status(404).send({ message: err.message });
      }
    }
  );

  app.get(
    "/usage/:integrationId",
    async (
      req: FastifyRequest<{ Params: { integrationId: string } }>,
      reply: FastifyReply
    ) => {
      const result = await pipe(
        getUsageEffect(req.params.integrationId),
        Effect.runPromise
      );
      reply.send(result);
    }
  );

  app.get(
    "/usage/:integrationId/range",
    async (
      req: FastifyRequest<{
        Params: { integrationId: string };
        Querystring: { start: string; end: string };
      }>,
      reply: FastifyReply
    ) => {
      const { start, end } = req.query;
      const result = await pipe(
        getUsageRangeEffect(req.params.integrationId, start, end),
        Effect.runPromise
      );
      reply.send(result);
    }
  );

  // --- Update a usage entry ---
  app.put(
    "/usage/:integrationId/:usageId",
    async (
      req: FastifyRequest<{
        Params: { integrationId: string; usageId: string };
        Body: Partial<UsageEntry>; // allow partial update
      }>,
      reply: FastifyReply
    ) => {
      try {
        const updated = await pipe(
          updateUsageEffect(
            req.params.integrationId,
            req.params.usageId,
            req.body
          ),
          Effect.runPromise
        );
        if (!updated)
          return reply.status(404).send({ message: "Usage entry not found" });
        reply.send(updated);
      } catch (err: any) {
        reply.status(400).send({ message: err.message });
      }
    }
  );

  // --- Delete a usage entry ---
  app.delete(
    "/usage/:integrationId/:usageId",
    async (
      req: FastifyRequest<{
        Params: { integrationId: string; usageId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const deleted = await pipe(
          deleteUsageEffect(req.params.integrationId, req.params.usageId),
          Effect.runPromise
        );
        if (!deleted)
          return reply.status(404).send({ message: "Usage entry not found" });
        reply.send(deleted);
      } catch (err: any) {
        reply.status(400).send({ message: err.message });
      }
    }
  );

  // Alerts Routes
  app.post(
    "/alerts",
    async (req: FastifyRequest<{ Body: Omit<Alert, "id"> }>, reply) => {
      try {
        const result = await pipe(
          createAlertEffect(req.body),
          Effect.runPromise
        );
        reply.send(result);
      } catch (err: any) {
        reply.status(404).send({ message: err.message });
      }
    }
  );

  app.get(
    "/alerts/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const alert = await pipe(
        getAlertEffect(req.params.id),
        Effect.runPromise
      );
      if (!alert) return reply.status(404).send({ message: "Alert not found" });
      reply.send(alert);
    }
  );

  app.put(
    "/alerts/:id",
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: Partial<Omit<Alert, "id" | "integrationId" | "type">>;
      }>,
      reply
    ) => {
      const updated = await pipe(
        updateAlertEffect(req.params.id, req.body),
        Effect.runPromise
      );
      if (!updated)
        return reply.status(404).send({ message: "Alert not found" });
      reply.send(updated);
    }
  );

  app.delete(
    "/alerts/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const deleted = await pipe(
        deleteAlertEffect(req.params.id),
        Effect.runPromise
      );
      if (!deleted)
        return reply.status(404).send({ message: "Alert not found" });
      reply.send(deleted);
    }
  );

  // --- User Routes ---
  app.post(
    "/users",
    async (
      req: FastifyRequest<{
        Body: { name: string; email: string; password: string };
      }>,
      reply
    ) => {
      if (!req.body.name || !req.body.email || !req.body.password) {
        return reply.status(400).send({ message: "Missing required fields" });
      }
      const result = await pipe(createUserEffect(req.body), Effect.runPromise);
      reply.send(result);
    }
  );

  app.get(
    "/users/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = await pipe(getUserEffect(req.params.id), Effect.runPromise);
      if (!user) return reply.status(404).send({ message: "User not found" });
      reply.send(user);
    }
  );

  app.put(
    "/users/:id",
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: { name?: string; email?: string };
      }>,
      reply
    ) => {
      const updated = await pipe(
        updateUserEffect(req.params.id, req.body),
        Effect.runPromise
      );
      if (!updated)
        return reply.status(404).send({ message: "User not found" });
      reply.send(updated);
    }
  );

  app.delete(
    "/users/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const deleted = await pipe(
        deleteUserEffect(req.params.id),
        Effect.runPromise
      );
      if (!deleted)
        return reply.status(404).send({ message: "User not found" });
      reply.send(deleted);
    }
  );

  // --- Auth Routes ---
  app.post(
    "/auth/login",
    async (
      req: FastifyRequest<{ Body: { email: string; password: string } }>,
      reply
    ) => {
      const user = await pipe(
        authenticateUserEffect(req.body.email, req.body.password),
        Effect.runPromise
      );
      if (!user)
        return reply.status(401).send({ message: "Invalid credentials" });

      const token = await pipe(signTokenEffect(user.id), Effect.runPromise);
      const refreshToken = await pipe(
        signRefreshTokenEffect(user.id),
        Effect.runPromise
      );

      reply.send({ token, refreshToken });
    }
  );

  app.post(
    "/auth/refresh",
    async (req: FastifyRequest<{ Body: { refreshToken: string } }>, reply) => {
      try {
        const payload = await pipe(
          verifyRefreshTokenEffect(req.body.refreshToken),
          Effect.runPromise
        );
        const token = await pipe(
          signTokenEffect(payload.userId),
          Effect.runPromise
        );
        reply.send({ token });
      } catch {
        reply.status(401).send({ message: "Invalid refresh token" });
      }
    }
  );

  app.post(
    "/auth/logout",
    async (req: FastifyRequest<{ Body: { token: string } }>, reply) => {
      // For MVP, we just respond; token invalidation not implemented
      reply.send({ message: "Logged out" });
    }
  );

  return app;
}
