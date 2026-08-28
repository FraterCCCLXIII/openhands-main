// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  getIntegrationLogoBranding,
} from "@/src/components/integrations/integration-logo-branding";
import {
  getIntegrationLogo,
  hasBundledIntegrationLogo,
} from "@/src/components/integrations/integration-logos";

describe("integration-logos", () => {
  it("recognizes bundled logos for catalog slugs and custom MCP", () => {
    expect(hasBundledIntegrationLogo("slack")).toBe(true);
    expect(hasBundledIntegrationLogo("custom-mcp")).toBe(true);
    expect(hasBundledIntegrationLogo("unknown-provider")).toBe(false);
  });

  it("returns a custom MCP logo instead of the generic fallback", () => {
    expect(getIntegrationLogo("custom-mcp")).not.toBe(getIntegrationLogo("missing"));
  });

  it("uses official brand SVGs instead of lucide placeholders for catalog providers", () => {
    for (const slug of [
      "apify",
      "browser-mcp",
      "exa",
      "firecrawl",
      "git",
      "neon",
      "playwright",
      "superhuman-mail",
      "tavily",
      "vanta",
    ]) {
      expect(hasBundledIntegrationLogo(slug)).toBe(true);
      expect(getIntegrationLogo(slug)).not.toBe(getIntegrationLogo("missing"));
    }
  });

  it("uses official brand tile colors for the new catalog logos", () => {
    expect(getIntegrationLogoBranding("vanta")).toEqual({
      iconBg: "#240642",
      iconColor: "#FFFFFF",
    });
    expect(getIntegrationLogoBranding("superhuman-mail").iconBg).toBe("#FF5C28");
    expect(getIntegrationLogoBranding("playwright").iconBg).toBe("#FFFFFF");
    expect(getIntegrationLogoBranding("apify").iconBg).toBe("#111111");
    expect(getIntegrationLogoBranding("neon")).toEqual({
      iconBg: "#000000",
      iconColor: "#12FFF7",
    });
    expect(getIntegrationLogoBranding("huggingface")).toEqual({
      iconBg: "#000000",
      iconColor: "#FFD21E",
    });
  });
});
