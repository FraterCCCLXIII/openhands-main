// @vitest-environment node

import { describe, expect, it } from "vitest";

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
});
