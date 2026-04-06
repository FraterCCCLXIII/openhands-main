import { describe, expect, it } from "vitest";

import {
  authStrategyLabel,
  buildCreatePayload,
  buildDiscoverPayload,
  filterReviewedTools,
  findConnectorByQuery,
  getReviewedTools,
  hasBuiltInCredentialInput,
  type DiscoveryResponse,
  type WizardDraft,
} from "@/src/components/integrations/wizard/utils";
import type { BuiltInConnectorOption, ToolSpec } from "@/src/types/context-layer";

const elevenLabsConnector: BuiltInConnectorOption = {
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

const basicConnector: BuiltInConnectorOption = {
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

const noAuthConnector: BuiltInConnectorOption = {
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

const oauthConnector: BuiltInConnectorOption = {
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

const bearerConnector: BuiltInConnectorOption = {
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

const baseDraft: WizardDraft = {
  kind: "built_in",
  key: "elevenlabs",
  name: "ElevenLabs",
  builtInSlug: "elevenlabs",
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
    builtInSlug: "elevenlabs",
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

  it("builds built-in discovery payloads for every credential strategy", () => {
    expect(buildDiscoverPayload(baseDraft, elevenLabsConnector)).toEqual({
      key: "elevenlabs",
      kind: "built_in",
      config: {
        builtInSlug: "elevenlabs",
      },
      credentials: {
        headerName: "xi-api-key",
        secret: "secret-key",
      },
    });

    expect(
      buildDiscoverPayload(
        { ...baseDraft, builtInSlug: "basic-auth", key: "basic-auth" },
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
        { ...baseDraft, builtInSlug: "public-feed", key: "public-feed" },
        noAuthConnector,
      ),
    ).toMatchObject({
      credentials: {},
    });

    expect(
      buildDiscoverPayload(
        { ...baseDraft, builtInSlug: "notion", key: "notion" },
        oauthConnector,
      ),
    ).toMatchObject({
      credentials: {},
    });

    expect(
      buildDiscoverPayload(
        { ...baseDraft, builtInSlug: "ordinal", key: "ordinal" },
        bearerConnector,
      ),
    ).toMatchObject({
      credentials: {
        accessToken: "bearer-secret",
      },
    });
  });

  it("validates required wizard selections before building payloads", () => {
    expect(() => buildDiscoverPayload({ ...baseDraft, kind: null }, elevenLabsConnector)).toThrow(
      "Select Built-in connector or MCP first.",
    );
    expect(
      () =>
        buildDiscoverPayload(
          { ...baseDraft, builtInSlug: " ", key: "elevenlabs" },
          elevenLabsConnector,
        ),
    ).toThrow("Choose a built-in connector first.");
    expect(() => buildCreatePayload({ ...baseDraft, kind: null }, discovery, {}, elevenLabsConnector)).toThrow(
      "Select Built-in connector or MCP first.",
    );
  });

  it("detects whether built-in credential input is ready for discovery", () => {
    expect(hasBuiltInCredentialInput(baseDraft, elevenLabsConnector)).toBe(true);
    expect(hasBuiltInCredentialInput({ ...baseDraft, apiKey: "   " }, elevenLabsConnector)).toBe(
      false,
    );
    expect(hasBuiltInCredentialInput(baseDraft, basicConnector)).toBe(true);
    expect(hasBuiltInCredentialInput({ ...baseDraft, password: " " }, basicConnector)).toBe(
      false,
    );
    expect(hasBuiltInCredentialInput(baseDraft, bearerConnector)).toBe(true);
    expect(hasBuiltInCredentialInput({ ...baseDraft, accessToken: " " }, bearerConnector)).toBe(
      false,
    );
    expect(hasBuiltInCredentialInput(baseDraft, noAuthConnector)).toBe(true);
    expect(hasBuiltInCredentialInput(baseDraft, oauthConnector)).toBe(false);
  });

  it("finds built-in connectors by normalized name, slug, or option label", () => {
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
      { ...baseDraft, name: "elevenlabs" },
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
        apiBaseUrl: "https://api.elevenlabs.io",
        builtInSlug: "elevenlabs",
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
        ...baseDraft,
        kind: "mcp",
        key: "custom-mcp",
        name: "",
        builtInSlug: "",
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
