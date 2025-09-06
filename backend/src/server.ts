// src/server.ts
import Fastify, {
  FastifyRequest,
  FastifyReply,
  RouteGenericInterface,
} from "fastify";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect"; // ✅ correct import
import { hash } from "bcryptjs";

// Extend FastifyRequest to include 'user'
declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string };
  }
}

interface IntegrationParams extends RouteGenericInterface {
  Params: { id: string };
}

interface CreateIntegrationBody {
  Body: Omit<Integration, "id">;
}

interface GetIntegrationRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface UpdateIntegrationBody extends RouteGenericInterface {
  Body: Partial<Omit<Integration, "id" | "type">>;
}

import {
  addIntegrationEffect,
  getIntegrationEffect,
  updateIntegrationEffect,
  deleteIntegrationEffect,
  listIntegrationsEffect,
  Integration,
} from "@services/integrationService.js";

import {
  recordUsageValidatedEffect,
  getUsageEffect,
  getUsageRangeEffect,
  updateUsageEffect,
  deleteUsageEffect,
  UsageEntry,
} from "@services/usageService.js";

import {
  getAlertEffect,
  createAlertEffect,
  updateAlertEffect,
  deleteAlertEffect,
  Alert,
} from "@services/alertsService.js";

import {
  createUserEffect,
  getUserEffect,
  updateUserEffect,
  deleteUserEffect,
  authenticateUserEffect,
  User,
} from "@services/userService.js";

import {
  signTokenEffect,
  signRefreshTokenEffect,
  verifyRefreshTokenEffect,
  verifyTokenEffect,
} from "@services/authService.js";

// Pre-handler to attach user info from token
const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" }); // return here
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = await pipe(verifyTokenEffect(token), Effect.runPromise);
    (req as any).user = { id: payload.userId };
  } catch {
    return reply.status(401).send({ error: "Unauthorized" }); // return here too
  }
};

export function buildServer() {
  const app = Fastify();

  // --- Integrations Routes ---
  app.post(
    "/integrations",
    { preHandler: authenticate },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (req as any).user?.id;
        if (!userId) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        // Cast body to Integration payload type
        const body = req.body as Omit<Integration, "id">;

        const result = await pipe(
          addIntegrationEffect(body, { userId }),
          Effect.runPromise
        );

        reply.send(result);
      } catch (err: any) {
        reply
          .status(500)
          .send({ error: "Failed to add integration", details: err.message });
      }
    }
  );

  // GET /integrations/:id
  app.get(
    "/integrations/:id",
    { preHandler: authenticate },
    async (req: FastifyRequest<GetIntegrationRoute>, reply: FastifyReply) => {
      const integration = await pipe(
        getIntegrationEffect(req.params.id),
        Effect.runPromise
      );

      if (!integration)
        return reply.status(404).send({ message: "Integration not found" });
      reply.send(integration);
    }
  );

  // PUT /integrations/:id
  app.put(
    "/integrations/:id",
    { preHandler: authenticate },
    async (
      req: FastifyRequest<UpdateIntegrationBody & IntegrationParams>,
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

  // DELETE /integrations/:id
  app.delete(
    "/integrations/:id",
    { preHandler: authenticate },
    async (req: FastifyRequest<IntegrationParams>, reply: FastifyReply) => {
      await pipe(deleteIntegrationEffect(req.params.id), Effect.runPromise);
      reply.send({ message: "Integration deleted" });
    }
  );

  app.get(
    "/integrations",
    { preHandler: authenticate },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (req as any).user?.id;
        if (!userId) {
          reply.status(401).send({ error: "Unauthorized" });
          return;
        }

        // call the effect function with ctx
        const list = await pipe(
          listIntegrationsEffect({ userId }), // <-- call the function
          Effect.runPromise
        );

        reply.send(list);
      } catch (err) {
        reply
          .status(500)
          .send({ error: "Failed to list integrations", details: err });
      }
    }
  );

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
      const { name, email, password } = req.body;
      const result = await pipe(
        createUserEffect(name, email, password),
        Effect.runPromise
      );
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
    "/auth/signup",
    async (
      req: FastifyRequest<{
        Body: { name: string; email: string; password: string };
      }>,
      reply
    ) => {
      try {
        const user = await pipe(
          createUserEffect(req.body.name, req.body.email, req.body.password),
          Effect.runPromise
        );

        const token = await pipe(signTokenEffect(user.id), Effect.runPromise);
        const refreshToken = await pipe(
          signRefreshTokenEffect(user.id),
          Effect.runPromise
        );

        reply.send({ token, refreshToken });
      } catch (err) {
        reply.status(400).send({ message: (err as Error).message });
      }
    }
  );

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
