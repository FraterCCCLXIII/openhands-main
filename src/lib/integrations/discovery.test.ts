import { describe, expect, it } from "vitest";

import {
  discoverIntegration,
  inferMcpAuthStrategy,
  listBuiltInConnectors,
  normalizeComposioAuthModes,
} from "@/src/lib/integrations/discovery";

describe("normalizeComposioAuthModes", () => {
  it("normalizes multiple auth schemes and preserves no-auth support", () => {
    expect(
      normalizeComposioAuthModes(["oauth2", "api_key", "bearer_token"], true),
    ).toEqual(["oauth2", "api_key", "bearer", "none"]);
  });

  it("falls back to oauth2 when Composio provides no auth metadata", () => {
    expect(normalizeComposioAuthModes()).toEqual(["oauth2"]);
  });
});

describe("listBuiltInConnectors", () => {
  it("returns the curated Vercel-hosted built-in connector catalog", async () => {
    const connectors = await listBuiltInConnectors();
    const github = connectors.find((connector) => connector.slug === "github");
    const notion = connectors.find((connector) => connector.slug === "notion");
    const googleDocs = connectors.find(
      (connector) => connector.slug === "google-docs",
    );

    expect(connectors).toHaveLength(5);
    expect(github).toMatchObject({
      name: "GitHub",
      authModes: ["bearer"],
      credentialLabel: "GitHub token",
      toolCount: 4,
    });
    expect(notion).toMatchObject({
      name: "Notion",
      authModes: ["oauth2"],
      credentialLabel: "Connect Notion",
    });
    expect(googleDocs).toMatchObject({
      name: "Google Docs",
      credentialPlaceholder: "ya29....",
      toolCount: 4,
    });
  });
});

describe("discoverIntegration", () => {
  it("maps curated built-in connectors to internal MCP endpoints", async () => {
    await expect(
      discoverIntegration(
        {
          key: "github",
          kind: "built_in",
          config: {
            builtInSlug: "github",
          },
          credentials: {
            accessToken: "github-pat",
          },
        },
        {
          baseUrl: "https://context-layer.vercel.app",
        },
      ),
    ).resolves.toMatchObject({
      provider: "mcp",
      authStrategy: "bearer",
      config: {
        builtInSlug: "github",
        serverUrl: "https://context-layer.vercel.app/api/mcp/github",
      },
      credentials: {
        accessToken: "github-pat",
      },
      functions: {
        get_me: {
          config: {
            toolName: "get_me",
          },
          defaultScopes: ["read"],
        },
        create_issue: {
          defaultScopes: ["write"],
        },
      },
    });
  });

  it("does not require an embedded token for OAuth built-in connectors", async () => {
    await expect(
      discoverIntegration(
        {
          key: "notion",
          kind: "built_in",
          config: {
            builtInSlug: "notion",
          },
          credentials: {},
        },
        {
          baseUrl: "https://context-layer.vercel.app",
        },
      ),
    ).resolves.toMatchObject({
      authStrategy: "oauth2",
      config: {
        builtInSlug: "notion",
        serverUrl: "https://context-layer.vercel.app/api/mcp/notion",
      },
      credentials: {},
    });
  });
});

describe("inferMcpAuthStrategy", () => {
  it("treats a default header name without a secret as no auth", () => {
    expect(inferMcpAuthStrategy({ headerName: "X-API-Key" })).toBe("none");
  });

  it("handles an empty string secret as no auth", () => {
    expect(
      inferMcpAuthStrategy({
        headerName: "X-API-Key",
        secret: "",
      }),
    ).toBe("none");
  });

  it("prefers oauth2 when an access token is present", () => {
    expect(
      inferMcpAuthStrategy({
        accessToken: "github-pat",
        headerName: "X-API-Key",
      }),
    ).toBe("oauth2");
  });

  it("uses api_key when a secret is configured", () => {
    expect(
      inferMcpAuthStrategy({
        headerName: "X-API-Key",
        secret: "context-secret",
      }),
    ).toBe("api_key");
  });

  it("requires both username and password for basic auth", () => {
    expect(
      inferMcpAuthStrategy({
        username: "demo",
      }),
    ).toBe("none");
    expect(
      inferMcpAuthStrategy({
        username: "demo",
        password: "secret",
      }),
    ).toBe("basic");
  });
});
