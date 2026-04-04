import { randomUUID } from "node:crypto";
import { Composio } from "@composio/core";

import type {
  AdapterInvocationInput,
  IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";
import { ContextLayerError } from "@/src/lib/core/errors";

const parseResult = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export class ComposioAdapter implements IntegrationAdapter {
  private readonly client: Composio | null;

  constructor(apiKey = process.env.COMPOSIO_API_KEY) {
    this.client = apiKey ? new Composio({ apiKey }) : null;
  }

  async invoke({ agentId, integration, toolSpec, payload }: AdapterInvocationInput) {
    const resolvedAgentId = agentId?.trim() || "context-layer-agent";
    if (!this.client) {
      throw new ContextLayerError(
        "COMPOSIO_API_KEY is required to invoke Composio-backed integrations.",
        500,
      );
    }

    const toolSlug =
      (toolSpec.config.composioToolSlug as string | undefined) ??
      (integration.config.defaultToolSlug as string | undefined);

    if (!toolSlug) {
      throw new ContextLayerError(
        `Function '${toolSpec.name}' is missing a composioToolSlug configuration.`,
        400,
      );
    }

    const connectedAccountId =
      (toolSpec.config.connectedAccountId as string | undefined) ??
      (integration.credentials.connectedAccountId as string | undefined);

    const toolCall = {
      id: randomUUID(),
      type: "function" as const,
      function: {
        name: toolSlug,
        arguments: JSON.stringify(payload),
      },
    };

    const result = await this.client.provider.executeToolCall(resolvedAgentId, toolCall, {
      connectedAccountId,
    });

    return parseResult(result);
  }
}
