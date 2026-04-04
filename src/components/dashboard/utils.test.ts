import { describe, expect, it } from "vitest";

import {
  buildInstalledIntegrationKeys,
  buildMarketplaceConnectors,
  filterIntegrationsForDisplay,
  matchesAccessRequestSearch,
} from "@/src/components/dashboard/utils";
import type {
  AccessRequest,
  BuiltInConnectorOption,
  IntegrationSpec,
} from "@/src/types/context-layer";

const connectors: BuiltInConnectorOption[] = [
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
    config: { builtInSlug: "slack" },
    credentials: {},
    functions: {
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
  functionName: "slack_search_public",
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

describe("dashboard-workspace-utils", () => {
  it("builds marketplace rows in popular order while excluding installed connectors", () => {
    const installedKeys = buildInstalledIntegrationKeys(integrations);

    const results = buildMarketplaceConnectors({
      builtInConnectors: connectors,
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
});
