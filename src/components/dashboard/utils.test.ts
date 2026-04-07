// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { getConnectorLogoUrl } from "@/src/components/dashboard/shared";
import {
  approvalStatusTone,
  buildConnectorMap,
  buildInstalledIntegrationKeys,
  buildMarketplaceConnectors,
  buildToolAccessPatch,
  buildUnusedToolCandidates,
  copyTextToClipboard,
  countApprovalRequestsByStatus,
  filterIntegrationsForDisplay,
  formatApprovalIdentityValue,
  formatTimestamp,
  formatTrackedUsage,
  hasMissingApprovalIdentity,
  maskApiKey,
  maskStoredApiKey,
  matchesAccessRequestFilter,
  matchesAccessRequestSearch,
  resolveIntegrationLogoUrl,
  subtractUnusedWindow,
} from "@/src/components/dashboard/utils";
import type {
  AccessRequest,
  ManagedConnectorOption,
  IntegrationSpec,
} from "@/src/types/context-layer";

const connectors: ManagedConnectorOption[] = [
  {
    slug: "slack",
    name: "Slack",
    description: "Chat",
    appUrl: "https://slack.com",
    toolCount: 10,
    categories: ["Communication"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    oauthConfigured: true,
    credentialLabel: "OAuth",
    credentialPlaceholder: "Connect Slack",
    credentialHelp: "Connect Slack.",
  },
  {
    slug: "notion",
    name: "Notion",
    description: "Docs",
    appUrl: "https://notion.so",
    toolCount: 8,
    categories: ["Knowledge base"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    oauthConfigured: true,
    credentialLabel: "OAuth",
    credentialPlaceholder: "Connect Notion",
    credentialHelp: "Connect Notion.",
  },
  {
    slug: "linear",
    name: "Linear",
    description: "Planning",
    appUrl: "https://linear.app",
    toolCount: 6,
    categories: ["Project management"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    oauthConfigured: true,
    credentialLabel: "OAuth",
    credentialPlaceholder: "Connect Linear",
    credentialHelp: "Connect Linear.",
  },
  {
    slug: "airtable",
    name: "Airtable",
    description: "Database",
    appUrl: "https://airtable.com",
    toolCount: 5,
    categories: ["Data"],
    authModes: ["bearer"],
    authStrategy: "bearer",
    credentialLabel: "Token",
    credentialPlaceholder: "Paste token",
    credentialHelp: "Token help.",
  },
];

const integrations: IntegrationSpec[] = [
  {
    key: "slack",
    name: "Slack",
    provider: "mcp",
    kind: "mcp",
    authStrategy: "oauth2",
    enabled: true,
    fineGrainedPermissions: true,
    config: { managedConnectorSlug: "slack" },
    credentials: {},
    tools: {
      slack_search_public: {
        name: "slack_search_public",
        description: "Search Slack",
        enabled: true,
        accessMode: "enabled",
        fineGrainedPermissions: true,
        defaultScopes: [],
        executionMode: "provider",
        config: {},
      },
      slack_delete_message: {
        name: "slack_delete_message",
        description: "Delete Slack message",
        enabled: false,
        accessMode: "disabled",
        fineGrainedPermissions: true,
        defaultScopes: [],
        executionMode: "provider",
        config: {},
      },
    },
  },
];

const accessRequest: AccessRequest = {
  id: "request-1",
  agentId: null,
  agentClass: null,
  integrationKey: "slack",
  toolName: "slack_search_public",
  scopes: ["messages:read"],
  requestedMinutes: 60,
  channels: ["in_app"],
  notificationTargets: {},
  justification: "Need to debug a customer thread",
  status: "pending",
  agentData: {
    conversationLink: "https://app.all-hands.dev/conversations/example",
  },
  createdAt: "2026-04-01T12:00:00.000Z",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("dashboard-workspace-utils", () => {
  it("builds exact tool access patch payloads", () => {
    expect(
      buildToolAccessPatch("slack", "slack_search_public", "approval_required"),
    ).toEqual({
      url: "/api/integrations/slack/tools/slack_search_public",
      method: "PATCH",
      body: { accessMode: "approval_required" },
    });
  });

  it("builds marketplace rows in popular order while excluding installed connectors", () => {
    const installedKeys = buildInstalledIntegrationKeys(integrations);

    const results = buildMarketplaceConnectors({
      managedConnectors: connectors,
      installedIntegrationKeys: installedKeys,
      search: "",
    });

    expect(results.map((connector) => connector.slug)).toEqual([
      "notion",
      "linear",
      "airtable",
    ]);
  });

  it("filters integrations by search while hiding disabled tools", () => {
    const filtered = filterIntegrationsForDisplay({
      integrations,
      integrationSearch: "delete",
      hideDisabledTools: true,
    });

    expect(filtered).toHaveLength(0);

    const visible = filterIntegrationsForDisplay({
      integrations,
      integrationSearch: "search",
      hideDisabledTools: true,
    });

    expect(visible).toHaveLength(1);
    expect(visible[0]?.visibleTools.map((toolSpec) => toolSpec.name)).toEqual([
      "slack_search_public",
    ]);
  });

  it("matches approval requests by conversation link and missing identity values", () => {
    expect(matchesAccessRequestSearch(accessRequest, "conversations/example")).toBe(true);
    expect(matchesAccessRequestSearch(accessRequest, "messages:read")).toBe(true);
    expect(matchesAccessRequestSearch(accessRequest, "not provided")).toBe(false);
  });

  it("covers unused-window math, tracked usage formatting, and approval metadata helpers", () => {
    const reference = new Date("2026-04-15T00:00:00.000Z");

    expect(subtractUnusedWindow(reference, 2, "days").toISOString()).toBe(
      "2026-04-13T00:00:00.000Z",
    );
    expect(subtractUnusedWindow(reference, 2, "weeks").toISOString()).toBe(
      "2026-04-01T00:00:00.000Z",
    );
    expect(subtractUnusedWindow(reference, 2, "months").toISOString()).toBe(
      "2026-02-15T00:00:00.000Z",
    );

    expect(
      formatTrackedUsage({
        name: "noHistory",
        description: "",
        enabled: true,
        fineGrainedPermissions: true,
        defaultScopes: [],
        executionMode: "provider",
        config: {},
      }),
    ).toBe("No tracked usage yet");

    const unknownOutcome = formatTrackedUsage({
      name: "zeroCount",
      description: "",
      enabled: true,
      fineGrainedPermissions: true,
      defaultScopes: [],
      executionMode: "provider",
      config: {},
      lastInvokedAt: "2026-04-01T12:00:00.000Z",
      invocationCount: 0,
    });
    expect(unknownOutcome).toContain("Last tracked invocation:");
    expect(unknownOutcome).toContain("unknown");
    expect(unknownOutcome).not.toContain("total");

    expect(
      formatTrackedUsage({
        name: "providerError",
        description: "",
        enabled: true,
        fineGrainedPermissions: true,
        defaultScopes: [],
        executionMode: "provider",
        config: {},
        lastInvokedAt: "2026-04-01T12:00:00.000Z",
        lastInvocationOutcome: "error",
        invocationCount: 3,
      }),
    ).toContain("3 total · error");

    const approvedRequest: AccessRequest = {
      ...accessRequest,
      id: "request-2",
      status: "approved",
      agentId: "agent-7",
    };
    const deniedRequest: AccessRequest = {
      ...accessRequest,
      id: "request-3",
      status: "rejected",
      agentClass: "operator",
    };

    expect(approvalStatusTone("pending")).toBe("warning");
    expect(approvalStatusTone("approved")).toBe("success");
    expect(approvalStatusTone("rejected")).toBe("danger");
    expect(matchesAccessRequestFilter(accessRequest, "pending")).toBe(true);
    expect(matchesAccessRequestFilter(approvedRequest, "pending")).toBe(false);
    expect(hasMissingApprovalIdentity(accessRequest)).toBe(true);
    expect(hasMissingApprovalIdentity(approvedRequest)).toBe(false);
    expect(formatApprovalIdentityValue(null)).toBe("Not provided");
    expect(formatApprovalIdentityValue("assistant")).toBe("assistant");
    expect(countApprovalRequestsByStatus([accessRequest, approvedRequest, deniedRequest])).toEqual({
      pending: 1,
      approved: 1,
      denied: 1,
    });
    expect(formatTimestamp()).toBe("—");
    expect(formatTimestamp("2026-04-01T12:00:00.000Z")).not.toBe("—");
  });

  it("covers api key masking, filtering, unused tool candidates, and logo resolution helpers", () => {
    expect(maskApiKey("  abc12345  ", false)).toBe("••••••••");
    expect(maskApiKey("  abcdefghijklmnop  ", false)).toBe("abcd••••••••••••mnop");
    expect(maskApiKey("  abcdefghijklmnop  ", true)).toBe("abcdefghijklmnop");
    expect(maskApiKey("   ", false)).toBe("");
    expect(maskStoredApiKey("", "")).toBe("");
    expect(maskStoredApiKey("clu_1234", "wxyz")).toBe("clu_1234••••••••••••wxyz");

    const integrationsWithVariants: IntegrationSpec[] = [
      ...integrations,
      {
        key: "github",
        name: "GitHub",
        provider: "mcp",
        kind: "mcp",
        authStrategy: "bearer",
        enabled: false,
        fineGrainedPermissions: true,
        config: { managedConnectorSlug: " github ", serverUrl: "https://github.com/api" },
        credentials: {},
        tools: {
          delete_repo: {
            name: "delete_repo",
            description: "Delete repositories",
            enabled: false,
            accessMode: "disabled",
            fineGrainedPermissions: true,
            defaultScopes: ["repo:admin"],
            executionMode: "provider",
            config: {},
            lastInvokedAt: "2026-01-01T00:00:00.000Z",
          },
          stale_admin: {
            name: "stale_admin",
            description: "Old admin tool",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: ["repo:admin"],
            executionMode: "provider",
            config: {},
            lastInvokedAt: "2026-01-01T00:00:00.000Z",
          },
        },
      },
      {
        key: "custom",
        name: "Custom",
        provider: "http",
        kind: "api",
        authStrategy: "api_key",
        enabled: true,
        fineGrainedPermissions: true,
        config: { apiBaseUrl: "https://api.example.com/v1" },
        credentials: {},
        tools: {
          ping: {
            name: "ping",
            description: "Ping endpoint",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: [],
            executionMode: "provider",
            config: {},
          },
        },
      },
    ];

    expect(Array.from(buildInstalledIntegrationKeys(integrationsWithVariants))).toEqual([
      "slack",
      "github",
      "custom",
    ]);

    const visibleDisabledTool = filterIntegrationsForDisplay({
      integrations: integrationsWithVariants,
      integrationSearch: "github",
      hideDisabledTools: false,
    });
    expect(visibleDisabledTool).toHaveLength(1);
    expect(visibleDisabledTool[0]?.visibleTools.map((toolSpec) => toolSpec.name)).toEqual([
      "delete_repo",
      "stale_admin",
    ]);

    expect(
      filterIntegrationsForDisplay({
        integrations: integrationsWithVariants,
        integrationSearch: "does-not-exist",
        hideDisabledTools: true,
      }),
    ).toEqual([]);

    expect(
      buildUnusedToolCandidates({
        integrations: integrationsWithVariants,
        cutoffDate: new Date("2026-02-01T00:00:00.000Z"),
      }),
    ).toEqual([
      {
        integrationKey: "github",
        toolName: "stale_admin",
        lastInvokedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const connectorBySlug = buildConnectorMap(connectors);
    expect(
      resolveIntegrationLogoUrl({
        integration: integrationsWithVariants[1]!,
        connectorBySlug,
        getConnectorLogoUrl,
      }),
    ).toBe("https://github.com/favicon.ico");
    expect(
      resolveIntegrationLogoUrl({
        integration: integrationsWithVariants[2]!,
        connectorBySlug,
        getConnectorLogoUrl,
      }),
    ).toBe("https://api.example.com/favicon.ico");
  });

  it("copies text through clipboard helpers and falls back when browser APIs are missing", async () => {
    const clipboardWriteText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: clipboardWriteText },
    });

    await copyTextToClipboard("hello world");
    expect(clipboardWriteText).toHaveBeenCalledWith("hello world");

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });

    await copyTextToClipboard("fallback copy");
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();

    const originalDocument = document;
    const originalNavigator = navigator;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: undefined,
    });

    await expect(copyTextToClipboard("missing")).rejects.toThrow(
      "Clipboard API unavailable",
    );

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

});
