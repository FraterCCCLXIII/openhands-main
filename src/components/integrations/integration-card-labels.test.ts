// @vitest-environment node

import { describe, expect, it } from "vitest";

import { isRedundantIntegrationCardLabel } from "@/src/components/integrations/integration-card-labels";

describe("isRedundantIntegrationCardLabel", () => {
  it("treats slug/provider variants of the card name as redundant", () => {
    expect(isRedundantIntegrationCardLabel("elevenlabs", "ElevenLabs")).toBe(true);
    expect(isRedundantIntegrationCardLabel("github", "GitHub", "github")).toBe(true);
  });

  it("keeps distinct metadata labels", () => {
    expect(isRedundantIntegrationCardLabel("mcp", "ElevenLabs", "elevenlabs")).toBe(
      false,
    );
    expect(isRedundantIntegrationCardLabel("http", "ElevenLabs", "elevenlabs")).toBe(
      false,
    );
  });
});
