import { describe, expect, it } from "vitest";

import {
  evaluateIntegrationAccess,
  getToolAccessMode,
  getToolSpecOrThrow,
  normalizeScopes,
  normalizeToolSpec,
  normalizeTools,
  resolveEffectiveScopes,
  sameScopes,
  subtractUnusedWindow,
} from "@/src/lib/core/access-policy";
import type {
  AgentClassPolicy,
  IntegrationSpec,
  TemporaryGrant,
  ToolSpec,
} from "@/src/types/context-layer";

const baseTool = (overrides: Partial<ToolSpec> = {}): ToolSpec => ({
  name: "accounts",
  description: "List accounts",
  enabled: true,
  fineGrainedPermissions: true,
  defaultScopes: ["accounts.read"],
  executionMode: "provider",
  config: {},
  ...overrides,
});

const baseIntegration = (overrides: Partial<IntegrationSpec> = {}): IntegrationSpec => ({
  key: "salesforce",
  name: "Salesforce",
  kind: "api",
  provider: "http",
  authStrategy: "bearer",
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  tools: {
    accounts: baseTool(),
  },
  ...overrides,
});

const basePolicy = (overrides: Partial<AgentClassPolicy> = {}): AgentClassPolicy => ({
  agentClass: "assistant",
  rules: [
    {
      integrationKey: "salesforce",
      toolNames: ["accounts"],
      scopes: ["accounts.read"],
      enabled: true,
    },
  ],
  ...overrides,
});

const activeGrant = (
  overrides: Partial<TemporaryGrant> = {},
): TemporaryGrant => ({
  id: "grant-1",
  agentId: "agent-1",
  agentClass: "assistant",
  integrationKey: "salesforce",
  toolName: "accounts",
  scopes: ["accounts.read"],
  grantedBy: "admin@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2099-01-01T00:30:00.000Z",
  ...overrides,
});

describe("access-policy", () => {
  it("sorts and compares scopes deterministically", () => {
    expect(normalizeScopes(["beta", "alpha", "alpha"]))
      .toEqual(["alpha", "alpha", "beta"]);
    expect(sameScopes(["alpha", "beta"], ["beta", "alpha"]))
      .toBe(true);
    expect(sameScopes(["alpha"], ["alpha", "beta"]))
      .toBe(false);
    expect(sameScopes(["alpha", "beta"], ["alpha", "gamma"]))
      .toBe(false);
  });

  it("normalizes tool access mode and enabled state", () => {
    expect(getToolAccessMode(baseTool())).toBe("enabled");
    expect(getToolAccessMode(baseTool({ enabled: false }))).toBe("disabled");
    expect(getToolAccessMode(baseTool({ accessMode: "approval_required" })))
      .toBe("approval_required");

    expect(normalizeToolSpec(baseTool({ accessMode: "approval_required", enabled: false })))
      .toMatchObject({ accessMode: "approval_required", enabled: true });
    expect(normalizeToolSpec(baseTool({ accessMode: "disabled", enabled: true })))
      .toMatchObject({ accessMode: "disabled", enabled: false });
    expect(normalizeTools({
      accounts: baseTool({ accessMode: "disabled", enabled: true }),
    }).accounts).toMatchObject({ accessMode: "disabled", enabled: false });
  });

  it("uses requested scopes when present and falls back to default scopes", () => {
    expect(resolveEffectiveScopes(baseTool(), ["accounts.write", "accounts.write"]))
      .toEqual(["accounts.write"]);
    expect(resolveEffectiveScopes(baseTool({ defaultScopes: ["accounts.read", "accounts.read"] })))
      .toEqual(["accounts.read"]);
  });

  it("throws a 404 when the requested tool does not exist", () => {
    expect(() => getToolSpecOrThrow(baseIntegration(), "contacts")).toThrow(
      "Unknown tool 'contacts' for integration 'salesforce'.",
    );
  });

  it("denies disabled integrations and disabled tools", () => {
    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration({ enabled: false }),
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [],
        policy: null,
      }),
    ).toEqual({
      allowed: false,
      reason: "Integration disabled",
      effectiveScopes: ["accounts.read"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration({
          tools: {
            accounts: baseTool({ enabled: false }),
          },
        }),
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [],
        policy: null,
      }),
    ).toEqual({
      allowed: false,
      reason: "Tool disabled",
      effectiveScopes: ["accounts.read"],
    });
  });

  it("requires approval for approval-required tools unless an active matching grant exists", () => {
    const integration = baseIntegration({
      tools: {
        accounts: baseTool({ accessMode: "approval_required" }),
      },
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration,
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [],
        policy: null,
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration,
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [activeGrant()],
        policy: null,
      }),
    ).toEqual({
      allowed: true,
      reason: "Allowed by temporary approval",
      effectiveScopes: ["accounts.read"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration,
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [activeGrant({ expiresAt: "2025-12-31T23:59:59.000Z" })],
        policy: null,
        currentTime: "2026-01-01T00:00:00.000Z",
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read"],
    });
  });

  it("allows enabled tools by default when no agent policy exists", () => {
    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration(),
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [],
        policy: null,
      }),
    ).toEqual({
      allowed: true,
      reason: "Allowed by enabled tool default",
      effectiveScopes: ["accounts.read"],
    });
  });

  it("enforces fine-grained policy rules and still honors temporary grants", () => {
    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration(),
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [],
        policy: basePolicy(),
      }),
    ).toEqual({
      allowed: true,
      reason: "Allowed by agent class policy",
      effectiveScopes: ["accounts.read"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration(),
        toolName: "accounts",
        requestedScopes: ["accounts.write"],
        temporaryGrants: [],
        policy: basePolicy(),
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.write"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration(),
        toolName: "accounts",
        requestedScopes: ["accounts.write"],
        temporaryGrants: [activeGrant({ scopes: ["accounts.write"] })],
        policy: basePolicy(),
      }),
    ).toEqual({
      allowed: true,
      reason: "Allowed by temporary approval",
      effectiveScopes: ["accounts.write"],
    });
  });

  it("rejects disabled rules, tool mismatches, and partial fine-grained scope matches", () => {
    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration(),
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [],
        policy: basePolicy({
          rules: [
            {
              integrationKey: "salesforce",
              toolNames: ["accounts"],
              scopes: ["accounts.read"],
              enabled: false,
            },
          ],
        }),
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration(),
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [],
        policy: basePolicy({
          rules: [
            {
              integrationKey: "salesforce",
              toolNames: ["contacts"],
              scopes: ["accounts.read"],
              enabled: true,
            },
          ],
        }),
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration(),
        toolName: "accounts",
        requestedScopes: ["accounts.read", "accounts.write"],
        temporaryGrants: [],
        policy: basePolicy({
          rules: [
            {
              integrationKey: "salesforce",
              toolNames: ["accounts"],
              scopes: ["accounts.read", "accounts.manage"],
              enabled: true,
            },
          ],
        }),
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read", "accounts.write"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration(),
        toolName: "accounts",
        requestedScopes: ["accounts.read", "accounts.write"],
        temporaryGrants: [],
        policy: basePolicy({
          rules: [
            {
              integrationKey: "salesforce",
              toolNames: [],
              scopes: [],
              enabled: true,
            },
          ],
        }),
      }),
    ).toEqual({
      allowed: true,
      reason: "Allowed by agent class policy",
      effectiveScopes: ["accounts.read", "accounts.write"],
    });
  });

  it("matches temporary grants on identity, target, scope coverage, and expiry", () => {
    const approvalRequiredIntegration = baseIntegration({
      tools: {
        accounts: baseTool({
          accessMode: "approval_required",
          defaultScopes: ["accounts.read", "accounts.write"],
        }),
      },
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: approvalRequiredIntegration,
        toolName: "accounts",
        requestedScopes: ["accounts.read", "accounts.write"],
        temporaryGrants: [activeGrant({ agentId: "agent-2", scopes: [] })],
        policy: null,
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read", "accounts.write"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: approvalRequiredIntegration,
        toolName: "accounts",
        requestedScopes: ["accounts.read", "accounts.write"],
        temporaryGrants: [activeGrant({ agentClass: "reviewer", scopes: [] })],
        policy: null,
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read", "accounts.write"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: approvalRequiredIntegration,
        toolName: "accounts",
        requestedScopes: ["accounts.read", "accounts.write"],
        temporaryGrants: [activeGrant({ integrationKey: "hubspot", scopes: [] })],
        policy: null,
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read", "accounts.write"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: approvalRequiredIntegration,
        toolName: "accounts",
        requestedScopes: ["accounts.read", "accounts.write"],
        temporaryGrants: [activeGrant({ toolName: "contacts", scopes: [] })],
        policy: null,
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read", "accounts.write"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: approvalRequiredIntegration,
        toolName: "accounts",
        requestedScopes: ["accounts.read", "accounts.write"],
        temporaryGrants: [activeGrant({ expiresAt: "2026-01-01T00:00:00.000Z", scopes: [] })],
        policy: null,
        currentTime: "2026-01-01T00:00:00.000Z",
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read", "accounts.write"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: approvalRequiredIntegration,
        toolName: "accounts",
        requestedScopes: ["accounts.read", "accounts.write"],
        temporaryGrants: [activeGrant({ scopes: [] })],
        policy: null,
      }),
    ).toEqual({
      allowed: true,
      reason: "Allowed by temporary approval",
      effectiveScopes: ["accounts.read", "accounts.write"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: approvalRequiredIntegration,
        toolName: "accounts",
        requestedScopes: ["accounts.read", "accounts.write"],
        temporaryGrants: [activeGrant({ scopes: ["accounts.read"] })],
        policy: null,
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read", "accounts.write"],
    });
  });

  it("uses default scopes when requested scopes are omitted", () => {
    const integration = baseIntegration({
      tools: {
        accounts: baseTool({
          accessMode: "approval_required",
          defaultScopes: ["accounts.read", "accounts.write"],
        }),
      },
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration,
        toolName: "accounts",
        temporaryGrants: [activeGrant({ scopes: [] })],
        policy: null,
      }),
    ).toEqual({
      allowed: true,
      reason: "Allowed by temporary approval",
      effectiveScopes: ["accounts.read", "accounts.write"],
    });
  });

  it("treats accessMode=disabled as disabled even when the tool remains enabled", () => {
    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration({
          tools: {
            accounts: baseTool({ enabled: true, accessMode: "disabled" }),
          },
        }),
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [activeGrant()],
        policy: null,
      }),
    ).toEqual({
      allowed: false,
      reason: "Tool disabled",
      effectiveScopes: ["accounts.read"],
    });
  });

  it("ignores policy rules for other integrations and only fine-grains when both flags are enabled", () => {
    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration({
          fineGrainedPermissions: false,
          tools: {
            accounts: baseTool({ fineGrainedPermissions: true }),
          },
        }),
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [],
        policy: basePolicy({
          rules: [
            {
              integrationKey: "hubspot",
              toolNames: ["contacts"],
              scopes: [],
              enabled: true,
            },
            {
              integrationKey: "salesforce",
              toolNames: ["contacts"],
              scopes: ["accounts.read"],
              enabled: true,
            },
          ],
        }),
      }),
    ).toEqual({
      allowed: true,
      reason: "Allowed by agent class policy",
      effectiveScopes: ["accounts.read"],
    });

    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration(),
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [],
        policy: basePolicy({
          rules: [
            {
              integrationKey: "hubspot",
              toolNames: ["accounts"],
              scopes: [],
              enabled: true,
            },
          ],
        }),
      }),
    ).toEqual({
      allowed: false,
      reason: "Permission required",
      effectiveScopes: ["accounts.read"],
    });
  });


  it("ignores tool-name matching when the integration is not fine-grained", () => {
    expect(
      evaluateIntegrationAccess({
        agentId: "agent-1",
        agentClass: "assistant",
        integration: baseIntegration({
          fineGrainedPermissions: false,
          tools: {
            accounts: baseTool({ fineGrainedPermissions: false }),
          },
        }),
        toolName: "accounts",
        requestedScopes: ["accounts.read"],
        temporaryGrants: [],
        policy: basePolicy({
          rules: [
            {
              integrationKey: "salesforce",
              toolNames: ["contacts"],
              scopes: ["accounts.read"],
              enabled: true,
            },
          ],
        }),
      }),
    ).toEqual({
      allowed: true,
      reason: "Allowed by agent class policy",
      effectiveScopes: ["accounts.read"],
    });
  });

  it("subtracts unused tool windows in days, weeks, and months", () => {
    const reference = "2026-04-06T12:00:00.000Z";

    expect(subtractUnusedWindow(reference, 3, "days"))
      .toBe("2026-04-03T12:00:00.000Z");
    expect(subtractUnusedWindow(reference, 2, "weeks"))
      .toBe("2026-03-23T12:00:00.000Z");
    expect(subtractUnusedWindow(reference, 1, "months"))
      .toBe("2026-03-06T12:00:00.000Z");
  });
});
