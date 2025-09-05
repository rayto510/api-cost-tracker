// src/services/integrationService.effect.ts
import * as Effect from "@effect/io/Effect";
import { v4 as uuidv4 } from "uuid";

export interface Integration {
  id: string;
  name: string;
  type: string;
  apiKey: string;
}

type IntegrationStore = Record<string, Integration>;
export const integrations: IntegrationStore = {};

// Add integration
export const addIntegrationEffect = (data: Omit<Integration, "id">) =>
  Effect.sync(() => {
    const id = uuidv4();
    const integration: Integration = { id, ...data };
    integrations[id] = integration;
    return integration;
  });

// Get integration
export const getIntegrationEffect = (id: string) =>
  Effect.sync(() => integrations[id] || null);

// Update integration
export const updateIntegrationEffect = (
  id: string,
  update: Partial<Omit<Integration, "id" | "type">>
) =>
  Effect.sync(() => {
    if (!integrations[id]) return null;
    integrations[id] = { ...integrations[id], ...update };
    return integrations[id];
  });

// Delete integration
export const deleteIntegrationEffect = (id: string) =>
  Effect.sync(() => {
    if (!integrations[id]) return null;
    delete integrations[id];
    return { message: "Integration deleted" };
  });

// List all integrations
export const listIntegrationsEffect = Effect.sync(() =>
  Object.values(integrations)
);
