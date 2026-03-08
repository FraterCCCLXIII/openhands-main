import type {
  AdapterInvocationInput,
  IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";

export class MockAdapter implements IntegrationAdapter {
  async invoke({ integration, functionSpec, payload }: AdapterInvocationInput) {
    return {
      ...(functionSpec.mockResponse ?? {}),
      message:
        (functionSpec.mockResponse as { message?: string } | undefined)?.message ??
        `Mock response from ${integration.key}.${functionSpec.name}`,
      payload,
    };
  }
}
