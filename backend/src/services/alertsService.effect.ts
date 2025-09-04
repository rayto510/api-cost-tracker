// src/services/alertsService.effect.ts
import * as Effect from "@effect/io/Effect";
import { getUsageEffect } from "./usageService.effect";
import { getIntegrationEffect } from "./integrationService.effect";
import { pipe } from "@effect/data/Function";

export interface Alert {
  id: string;
  integrationId: string;
  threshold: number;
  type: "cost" | "usage";
  notificationMethod: "email" | "slack";
  triggered?: boolean;
}

// In-memory store
export const alerts: Record<string, Alert> = {};

let nextAlertId = 1;

export const createAlertEffect = (alert: Omit<Alert, "id" | "triggered">) =>
  pipe(
    getIntegrationEffect(alert.integrationId),
    Effect.flatMap((integration) =>
      Effect.if(Boolean(integration), {
        onTrue: Effect.sync(() => {
          const id = String(nextAlertId++);
          const newAlert: Alert = { ...alert, id, triggered: false };
          alerts[id] = newAlert;
          return newAlert;
        }),
        onFalse: Effect.fail(new Error("Integration does not exist")),
      })
    )
  );

export const getAlertEffect = (id: string) =>
  Effect.sync(() => alerts[id] || null);

export const updateAlertEffect = (id: string, update: Partial<Alert>) =>
  Effect.sync(() => {
    if (!alerts[id]) return null;
    alerts[id] = { ...alerts[id], ...update };
    return alerts[id];
  });

export const deleteAlertEffect = (id: string) =>
  Effect.sync(() => {
    if (!alerts[id]) return null;
    const deleted = alerts[id];
    delete alerts[id];
    return { message: "Alert deleted" };
  });

// --- New: check alerts for an integration after recording usage ---
export const checkAlertsEffect = (integrationId: string) =>
  Effect.flatMap(getUsageEffect(integrationId), (usageEntries) =>
    Effect.sync(() => {
      const totalUsage = usageEntries.reduce((acc, e) => acc + e.usage, 0);
      const totalCost = usageEntries.reduce((acc, e) => acc + e.cost, 0);

      Object.values(alerts).forEach((alert) => {
        if (alert.integrationId !== integrationId) return;

        if (
          (alert.type === "usage" && totalUsage >= alert.threshold) ||
          (alert.type === "cost" && totalCost >= alert.threshold)
        ) {
          alert.triggered = true;
        }
      });
    })
  );
