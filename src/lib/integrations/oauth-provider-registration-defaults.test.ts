import { describe, expect, it } from "vitest";

import { getOAuthProviderRegistrationDefaults } from "@/src/lib/integrations/oauth-provider-registration-defaults";

describe("getOAuthProviderRegistrationDefaults", () => {
  it("returns HubSpot MCP defaults with PKCE and no custom scope bundle", () => {
    const defaults = getOAuthProviderRegistrationDefaults("hubspot");

    expect(defaults).toMatchObject({
      provider: "mcp",
      serverUrl: "https://mcp.hubspot.com",
      authorizationUrl: "https://mcp.hubspot.com/oauth/authorize/user",
      tokenUrl: "https://mcp.hubspot.com/oauth/v3/token",
      clientAuthentication: "body",
      pkce: true,
      scopes: [],
    });
    expect(defaults?.optionalScopes).toBeUndefined();
    expect(defaults?.toolScopes).toBeUndefined();
  });
});
