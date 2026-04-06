import type { ToolSpec, IntegrationProvider, IntegrationSpec } from "@/src/types/context-layer";
import { ContextLayerError } from "@/src/lib/core/errors";

export interface AdapterInvocationInput {
  agentId: string | null;
  integration: IntegrationSpec;
  toolSpec: ToolSpec;
  payload: Record<string, unknown>;
}

export interface IntegrationAdapter {
  invoke(input: AdapterInvocationInput): Promise<unknown>;
}

export class AdapterRegistry {
  constructor(private readonly adapters: Partial<Record<IntegrationProvider, IntegrationAdapter>>) {}

  async invoke(provider: IntegrationProvider, input: AdapterInvocationInput) {
    const adapter = this.adapters[provider];
    if (!adapter) {
      throw new ContextLayerError(`No adapter configured for provider '${provider}'`, 501);
    }

    return adapter.invoke(input);
  }
}
