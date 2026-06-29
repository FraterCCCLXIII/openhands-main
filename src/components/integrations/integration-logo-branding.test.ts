// @vitest-environment node

import { describe, expect, it } from "vitest";

import { listOAuthProviderCatalog } from "@/src/lib/integrations/oauth-provider-catalog";
import {
  DEFAULT_INTEGRATION_LOGO_BG,
  getIntegrationLogoBranding,
} from "@/src/components/integrations/integration-logo-branding";

describe("integration-logo-branding", () => {
  it("uses catalog branding for MCP marketplace entries", () => {
    expect(getIntegrationLogoBranding("slack")).toEqual({
      iconBg: "#4A154B",
      iconColor: "#FFFFFF",
    });
    expect(getIntegrationLogoBranding("notion")).toEqual({
      iconBg: "#FFFFFF",
      iconColor: "#000000",
    });
    expect(getIntegrationLogoBranding("github")).toEqual({
      iconBg: "#6E40C9",
      iconColor: "#FFFFFF",
    });
  });

  it("uses brand tile colors for OAuth catalog providers", () => {
    expect(getIntegrationLogoBranding("google-docs").iconBg).toBe("#4285F4");
    expect(getIntegrationLogoBranding("servicenow").iconBg).toBe("#62D84E");
    expect(getIntegrationLogoBranding("mailchimp")).toEqual({
      iconBg: "#FFE01B",
      iconColor: "#000000",
    });
  });

  it("covers every OAuth provider catalog slug", () => {
    for (const provider of listOAuthProviderCatalog()) {
      const logoSlug = provider.managedConnectorSlug ?? provider.slug;
      expect(getIntegrationLogoBranding(logoSlug).iconBg).not.toBe(
        DEFAULT_INTEGRATION_LOGO_BG,
      );
    }
  });

  it("falls back to the default tile for unknown slugs", () => {
    expect(getIntegrationLogoBranding("unknown-provider")).toEqual({
      iconBg: DEFAULT_INTEGRATION_LOGO_BG,
      iconColor: "#FFFFFF",
    });
  });
});
