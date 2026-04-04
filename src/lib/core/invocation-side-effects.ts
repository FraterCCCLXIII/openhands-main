import { randomUUID } from "node:crypto";

import { normalizeScopes } from "@/src/lib/core/access-policy";
import { normalizeOwnerId } from "@/src/lib/core/scoped-api-keys";
import type {
  IntegrationSpec,
  ToolInvocationOutcome,
  ToolInvocationRecord,
} from "@/src/types/context-layer";

export const normalizePayloadKeys = (payload: Record<string, unknown>) =>
  Object.keys(payload).sort((left, right) => left.localeCompare(right));

export const summarizeErrorMessage = (error: unknown, maxLength = 500) => {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.trim();
  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength - 1)}…`;
};

export const createToolInvocationRecord = ({
  ownerId,
  agentId,
  agentClass,
  integration,
  functionName,
  scopes,
  payloadKeys,
  invokedAt,
  outcome,
  durationMs,
  errorMessage,
}: {
  ownerId?: string;
  agentId: string | null;
  agentClass: string | null;
  integration: Pick<IntegrationSpec, "key" | "provider" | "kind" | "authStrategy">;
  functionName: string;
  scopes: string[];
  payloadKeys: string[];
  invokedAt: string;
  outcome: ToolInvocationOutcome;
  durationMs?: number;
  errorMessage?: string;
}): ToolInvocationRecord => ({
  id: randomUUID(),
  ownerId: ownerId ? normalizeOwnerId(ownerId) : undefined,
  agentId,
  agentClass,
  integrationKey: integration.key,
  functionName,
  scopes: normalizeScopes(scopes),
  provider: integration.provider,
  kind: integration.kind,
  authStrategy: integration.authStrategy,
  outcome,
  invokedAt,
  durationMs,
  payloadKeys,
  errorMessage,
});

export const runOptionalSideEffect = async (
  action: string,
  operation: () => Promise<void>,
) => {
  try {
    await operation();
  } catch (error) {
    console.warn(
      `[ContextLayerService] Failed to ${action}: ${summarizeErrorMessage(error)}`,
    );
  }
};
