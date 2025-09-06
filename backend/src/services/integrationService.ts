// src/services/integrationService.effect.ts
import * as Effect from "@effect/io/Effect";
import { prisma } from "@db/db.js";
import { v4 as uuidv4 } from "uuid";

export interface Integration {
  id: string;
  name: string;
  type: string;
  apiKey: string;
}

// Add integration
export const addIntegrationEffect = (
  data: Omit<Integration, "id">,
  ctx: { userId: string }
) =>
  Effect.try({
    try: async () => {
      const id = uuidv4();
      const newIntegration = await prisma.integration.create({
        data: {
          id,
          userId: ctx.userId,
          name: data.name,
          type: data.type,
          apiKey: data.apiKey,
        },
      });
      return newIntegration;
    },
    catch: (err) => new Error(`Failed to add integration: ${err}`),
  });

// Get integration
export const getIntegrationEffect = (id: string) =>
  Effect.sync(() => prisma.integration.findUnique({ where: { id } }));

// Update integration
export const updateIntegrationEffect = (
  id: string,
  update: Partial<Omit<Integration, "id" | "type">>
) =>
  Effect.try({
    try: async () => {
      const integration = await prisma.integration.findUnique({
        where: { id },
      });
      if (!integration) throw new Error("Integration not found");
      return integration;
    },
    catch: (err) => new Error(`Failed to get integration: ${err}`),
  });

// Delete integration
export const deleteIntegrationEffect = (id: string) =>
  Effect.sync(() => {
    return prisma.integration.delete({
      where: { id },
    });
  });

// List all integrations
export const listIntegrationsEffect = (ctx: { userId: string }) =>
  Effect.try({
    try: () => prisma.integration.findMany({ where: { userId: ctx.userId } }),
    catch: (err) => new Error(`Failed to list integrations: ${err}`),
  });
