import { describe, expect, it } from "vitest";

import {
  buildBuiltInConnectorOption,
  inferMcpAuthStrategy,
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

describe("buildBuiltInConnectorOption", () => {
  it("compacts connector metadata into the picker option shape", () => {
    expect(
      buildBuiltInConnectorOption({
        slug: "github",
        name: "GitHub",
        meta: {
          description: "GitHub issues, repos, and pull requests.",
          logo: "https://cdn.example.com/github.png",
          appUrl: "https://github.com",
          toolsCount: 42,
          categories: [
            { slug: "developer-tools", name: "Developer Tools" },
            { slug: "developer-tools", name: "Developer Tools" },
            { slug: "collaboration", name: "Collaboration" },
          ],
        },
        authSchemes: ["oauth2"],
        composioManagedAuthSchemes: ["api_key"],
        noAuth: false,
      }),
    ).toEqual({
      slug: "github",
      name: "GitHub",
      description: "GitHub issues, repos, and pull requests.",
      logoUrl: "https://cdn.example.com/github.png",
      appUrl: "https://github.com",
      toolCount: 42,
      categories: ["Developer Tools", "Collaboration"],
      authModes: ["oauth2", "api_key"],
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
