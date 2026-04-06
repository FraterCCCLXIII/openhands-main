import type {
  AdapterInvocationInput,
  IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";

export class MockAdapter implements IntegrationAdapter {
  async invoke({ integration, toolSpec, payload }: AdapterInvocationInput) {
    return {
      ...(toolSpec.mockResponse ?? {}),
      message:
        (toolSpec.mockResponse as { message?: string } | undefined)?.message ??
        `Mock response from ${integration.key}.${toolSpec.name}`,
      payload,
    };
  }
}
