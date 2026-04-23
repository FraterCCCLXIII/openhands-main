import { describe, expect, it } from "vitest";

import {
  authStrategyLabel,
  buildCreatePayload,
  buildDiscoverPayload,
  filterReviewedTools,
  findConnectorByQuery,
  getReviewedTools,
  hasManagedConnectorCredentialInput,
  type DiscoveryResponse,
  type WizardDraft,
} from "@/src/components/integrations/wizard/utils";
import type { ManagedConnectorOption, ToolSpec } from "@/src/types/context-layer";

const elevenLabsConnector: ManagedConnectorOption = {
  slug: "elevenlabs",
  name: "ElevenLabs",
  description: "Voice tools",
  appUrl: "https://elevenlabs.io",
  toolCount: 3,
  categories: ["Audio"],
  authModes: ["api_key"],
  authStrategy: "api_key",
  credentialLabel: "API key",
  credentialPlaceholder: "Paste key",
  credentialHelp: "Provide a key.",
  apiKeyHeaderName: "xi-api-key",
};

const basicConnector: ManagedConnectorOption = {
  slug: "basic-auth",
  name: "Basic Auth",
  description: "Username/password connector",
  toolCount: 2,
  categories: ["Utilities"],
  authModes: ["basic"],
  authStrategy: "basic",
  credentialLabel: "Basic auth",
  credentialPlaceholder: "demo",
  credentialHelp: "Provide a username and password.",
};

const noAuthConnector: ManagedConnectorOption = {
  slug: "public-feed",
  name: "Public Feed",
  description: "No-credential connector",
  toolCount: 1,
  categories: ["Feeds"],
  authModes: ["none"],
  authStrategy: "none",
  credentialLabel: "No credentials",
  credentialPlaceholder: "",
  credentialHelp: "No credentials required.",
};

const oauthConnector: ManagedConnectorOption = {
  slug: "notion",
  name: "Notion",
  description: "OAuth connector",
  toolCount: 4,
  categories: ["Knowledge base"],
  authModes: ["oauth2"],
  authStrategy: "oauth2",
  credentialLabel: "Connect Notion",
  credentialPlaceholder: "Connect Notion",
  credentialHelp: "Connect your Notion account.",
};

const bearerConnector: ManagedConnectorOption = {
  slug: "ordinal",
  name: "Ordinal",
  description: "Bearer connector",
  toolCount: 5,
  categories: ["Social"],
  authModes: ["bearer"],
  authStrategy: "bearer",
  credentialLabel: "Access token",
  credentialPlaceholder: "Paste token",
  credentialHelp: "Provide a bearer token.",
};

const managedDraft: WizardDraft = {
  kind: "managed",
  key: "elevenlabs",
  name: "ElevenLabs",
  managedConnectorSlug: "elevenlabs",
  serverUrl: "",
  accessToken: " bearer-secret ",
  apiKey: " secret-key ",
  headerName: " X-API-Key ",
  username: " alice ",
  password: " wonderland ",
};

const listModelsTool: ToolSpec = {
  name: "list_models",
  description: "List models",
  enabled: true,
  accessMode: "enabled",
  fineGrainedPermissions: true,
  defaultScopes: ["models:read"],
  executionMode: "provider",
  config: {},
};

const deleteVoiceTool: ToolSpec = {
  name: "delete_voice",
  description: "Delete voice",
  enabled: true,
  accessMode: "enabled",
  fineGrainedPermissions: true,
  defaultScopes: ["voices:write"],
  executionMode: "provider",
  config: {},
};

const discovery: DiscoveryResponse = {
  provider: "http",
  authStrategy: "api_key",
  config: {
    apiBaseUrl: "https://api.elevenlabs.io",
    managedConnectorSlug: "elevenlabs",
  },
  credentials: {
    headerName: "xi-api-key",
    secret: "secret-key",
  },
  tools: {
    list_models: listModelsTool,
    delete_voice: deleteVoiceTool,
  },
};

describe("integration-wizard-utils", () => {
  it("labels all supported auth strategies", () => {
    expect(authStrategyLabel("api_key")).toBe("API key");
    expect(authStrategyLabel("oauth2")).toBe("OAuth");
    expect(authStrategyLabel("bearer")).toBe("Bearer token");
    expect(authStrategyLabel("basic")).toBe("Basic auth");
    expect(authStrategyLabel("none")).toBe("No auth");
    expect(authStrategyLabel("mcp_session")).toBe("MCP session");
  });

  it("builds managed discovery payloads for every credential strategy", () => {
    expect(buildDiscoverPayload(managedDraft, elevenLabsConnector)).toEqual({
      key: "elevenlabs",
      kind: "managed",
      config: {
        managedConnectorSlug: "elevenlabs",
      },
      credentials: {
        headerName: "xi-api-key",
        secret: "secret-key",
      },
    });

    expect(
      buildDiscoverPayload(
        { ...managedDraft, managedConnectorSlug: "basic-auth", key: "basic-auth" },
        basicConnector,
      ),
    ).toMatchObject({
      credentials: {
        username: "alice",
        password: "wonderland",
      },
    });

    expect(
      buildDiscoverPayload(
        { ...managedDraft, managedConnectorSlug: "public-feed", key: "public-feed" },
        noAuthConnector,
      ),
    ).toMatchObject({
      credentials: {},
    });

    expect(
      buildDiscoverPayload(
        { ...managedDraft, managedConnectorSlug: "notion", key: "notion" },
        oauthConnector,
      ),
    ).toMatchObject({
      credentials: {},
    });

    expect(
      buildDiscoverPayload(
        { ...managedDraft, managedConnectorSlug: "ordinal", key: "ordinal" },
        bearerConnector,
      ),
    ).toMatchObject({
      credentials: {
        accessToken: "bearer-secret",
      },
    });
  });

  it("validates required wizard selections before building payloads", () => {
    expect(() => buildDiscoverPayload({ ...managedDraft, kind: null }, elevenLabsConnector)).toThrow(
      "Select Managed connector or MCP first.",
    );
    expect(
      () =>
        buildDiscoverPayload(
          { ...managedDraft, managedConnectorSlug: " ", key: "elevenlabs" },
          elevenLabsConnector,
        ),
    ).toThrow("Choose a managed connector first.");
    expect(() => buildCreatePayload({ ...managedDraft, kind: null }, discovery, {}, elevenLabsConnector)).toThrow(
      "Select Managed connector or MCP first.",
    );
  });

  it("detects whether managed connector credential input is ready for discovery", () => {
    expect(hasManagedConnectorCredentialInput(managedDraft, elevenLabsConnector)).toBe(true);
    expect(
      hasManagedConnectorCredentialInput(
        { ...managedDraft, apiKey: "   " },
        elevenLabsConnector,
      ),
    ).toBe(false);
    expect(hasManagedConnectorCredentialInput(managedDraft, basicConnector)).toBe(true);
    expect(
      hasManagedConnectorCredentialInput({ ...managedDraft, password: " " }, basicConnector),
    ).toBe(false);
    expect(hasManagedConnectorCredentialInput(managedDraft, bearerConnector)).toBe(true);
    expect(
      hasManagedConnectorCredentialInput(
        { ...managedDraft, accessToken: " " },
        bearerConnector,
      ),
    ).toBe(false);
    expect(hasManagedConnectorCredentialInput(managedDraft, noAuthConnector)).toBe(true);
    expect(hasManagedConnectorCredentialInput(managedDraft, oauthConnector)).toBe(false);
  });

  it("finds managed connectors by normalized name, slug, or option label", () => {
    expect(findConnectorByQuery([elevenLabsConnector], " elevenlabs ")).toBe(
      elevenLabsConnector,
    );
    expect(findConnectorByQuery([elevenLabsConnector], "ElevenLabs (ELEVENLABS)")).toBe(
      elevenLabsConnector,
    );
    expect(findConnectorByQuery([elevenLabsConnector], "missing")).toBeNull();
    expect(findConnectorByQuery([elevenLabsConnector], "   ")).toBeNull();
  });

  it("builds create payloads that preserve discovery metadata and updated access modes", () => {
    const payload = buildCreatePayload(
      { ...managedDraft, name: "elevenlabs" },
      discovery,
      {
        delete_voice: "disabled",
        list_models: "approval_required",
      },
      elevenLabsConnector,
    );

    expect(payload).toMatchObject({
      key: "elevenlabs",
      name: "ElevenLabs",
      kind: "api",
      provider: "http",
      authStrategy: "api_key",
      enabled: true,
      fineGrainedPermissions: true,
      config: {
        managedConnectorSlug: "elevenlabs",
      },
    });
    expect(payload.tools.list_models).toMatchObject({
      accessMode: "approval_required",
      enabled: true,
    });
    expect(payload.tools.delete_voice).toMatchObject({
      accessMode: "disabled",
      enabled: false,
    });
  });

  it("creates payloads for discovered MCP servers and falls back to the discovered tool defaults", () => {
    const mcpPayload = buildCreatePayload(
      {
        ...managedDraft,
        kind: "mcp",
        key: "custom-mcp",
        name: "",
        managedConnectorSlug: "",
      },
      {
        provider: "mcp",
        authStrategy: "bearer",
        config: {
          serverUrl: "https://example.com/mcp",
        },
        credentials: {
          accessToken: "bearer-secret",
        },
        tools: {
          zebraTool: {
            name: "zebraTool",
            description: "Zebra tool",
            enabled: false,
            fineGrainedPermissions: true,
            defaultScopes: [],
            executionMode: "provider",
            config: {},
          },
        },
      },
      {},
      null,
    );

    expect(mcpPayload).toMatchObject({
      key: "custom-mcp",
      name: "custom-mcp",
      kind: "mcp",
      provider: "mcp",
      authStrategy: "bearer",
    });
    expect(mcpPayload.tools.zebraTool).toMatchObject({
      accessMode: "disabled",
      enabled: false,
    });
  });

  it("sorts discovered tools and filters reviewed tools by search query", () => {
    expect(getReviewedTools(discovery).map(([name]) => name)).toEqual([
      "delete_voice",
      "list_models",
    ]);
    expect(getReviewedTools(null)).toEqual([]);

    const filteredByDescription = filterReviewedTools({
      toolSearch: "models",
      reviewedTools: getReviewedTools(discovery),
    });
    const filteredByScopes = filterReviewedTools({
      toolSearch: "voices:write",
      reviewedTools: getReviewedTools(discovery),
    });

    expect(filteredByDescription.map(([name]) => name)).toEqual(["list_models"]);
    expect(filteredByScopes.map(([name]) => name)).toEqual(["delete_voice"]);
  });
});
