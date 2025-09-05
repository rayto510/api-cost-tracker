// src/services/usageService.effect.ts
import * as Effect from "@effect/io/Effect";
import { pipe } from "@effect/data/Function";
import { getIntegrationEffect } from "@services/integrationService.js";
import { checkAlertsEffect } from "@services/alertsService.js";

export interface UsageEntry {
  date: string;
  usage: number;
  cost: number;
}

type UsageStore = Record<string, UsageEntry[]>;
const usageData: UsageStore = {};

export const recordUsageValidatedEffect = (
  integrationId: string,
  entry: UsageEntry
) =>
  pipe(
    getIntegrationEffect(integrationId),
    Effect.flatMap((integration) =>
      Effect.if(Boolean(integration), {
        onTrue: pipe(
          recordUsageEffect(integrationId, entry),
          Effect.flatMap(() =>
            pipe(
              checkAlertsEffect(integrationId),
              Effect.map(() => ({ message: "Usage recorded" })) // <-- return JSON
            )
          )
        ),
        onFalse: Effect.fail(new Error("Integration does not exist")),
      })
    )
  );

export const recordUsageEffect = (integrationId: string, entry: UsageEntry) =>
  Effect.sync(() => {
    if (!usageData[integrationId]) usageData[integrationId] = [];
    usageData[integrationId].push(entry);
    return { message: "Usage recorded" };
  });

export const getUsageEffect = (integrationId: string) =>
  Effect.sync(() => usageData[integrationId] || []);

export const getUsageRangeEffect = (
  integrationId: string,
  start: string,
  end: string
) =>
  Effect.sync(() =>
    (usageData[integrationId] || []).filter(
      (e) => e.date >= start && e.date <= end
    )
  );

// --- Update a usage entry ---
export const updateUsageEffect = (
  integrationId: string,
  usageId: string, // we’ll use the index in the array as ID for now
  data: Partial<UsageEntry>
) =>
  Effect.sync(() => {
    const entries = usageData[integrationId];
    if (!entries) return null;

    const index = parseInt(usageId, 10);
    if (isNaN(index) || index < 0 || index >= entries.length) return null;

    usageData[integrationId][index] = { ...entries[index], ...data };
    return usageData[integrationId][index];
  });

// --- Delete a usage entry ---
export const deleteUsageEffect = (integrationId: string, usageId: string) =>
  Effect.sync(() => {
    const entries = usageData[integrationId];
    if (!entries) return null;

    const index = parseInt(usageId, 10);
    if (isNaN(index) || index < 0 || index >= entries.length) return null;

    const [deleted] = entries.splice(index, 1);
    return deleted;
  });
