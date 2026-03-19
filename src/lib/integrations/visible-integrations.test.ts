import { describe, expect, it } from "vitest";

import { filterIntegrationsVisibleToOwner } from "@/src/lib/integrations/visible-integrations";
import type {
  IntegrationConnectionStatus,
  IntegrationSpec,
} from "@/src/types/context-layer";

const createIntegration = (
  overrides: Partial<IntegrationSpec> & Pick<IntegrationSpec, "key" | "name" | "kind" | "provider" | "authStrategy">,
): IntegrationSpec => ({
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  functions: {},
  ...overrides,
});

const createConnection = (
  integrationKey: string,
): IntegrationConnectionStatus => ({
  integrationKey,
  provider: "slack",
  authStrategy: "oauth2",
  scopes: [],
  metadata: {},
  createdAt: "2026-03-13T00:00:00.000Z",
  updatedAt: "2026-03-13T00:00:00.000Z",
});

describe("filterIntegrationsVisibleToOwner", () => {
  it("keeps only enabled integrations available to the current owner", () => {
    const integrations: IntegrationSpec[] = [
      createIntegration({
        key: "github",
        name: "GitHub",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "bearer",
      }),
      createIntegration({
        key: "slack",
        name: "Slack",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
      }),
      createIntegration({
        key: "notion",
        name: "Notion",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
        enabled: false,
      }),
      createIntegration({
        key: "service-now",
        name: "ServiceNow",
        kind: "api",
        provider: "http",
        authStrategy: "oauth2",
        credentials: { accessToken: "service-token" },
      }),
    ];

    const visible = filterIntegrationsVisibleToOwner(integrations, [
      createConnection("slack"),
    ]);

    expect(visible.map((integration) => integration.key)).toEqual([
      "github",
      "slack",
      "service-now",
    ]);
  });
});
