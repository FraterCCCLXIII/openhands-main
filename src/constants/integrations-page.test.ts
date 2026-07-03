// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  formatIntegrationToolCountLabel,
  getAuthTypeLabel,
} from "@/src/constants/integrations-page";

describe("formatIntegrationToolCountLabel", () => {
  it("matches catalog-style singular and plural labels when counts align", () => {
    expect(formatIntegrationToolCountLabel(0, 0)).toBe("0 tools");
    expect(formatIntegrationToolCountLabel(1, 1)).toBe("1 tool");
    expect(formatIntegrationToolCountLabel(2, 2)).toBe("2 tools");
  });

  it("shows filtered totals when visible tools differ from the full set", () => {
    expect(formatIntegrationToolCountLabel(0, 1)).toBe("0 of 1 tools");
    expect(formatIntegrationToolCountLabel(1, 3)).toBe("1 of 3 tools");
  });
});

describe("getAuthTypeLabel", () => {
  it("labels unauthenticated integrations as No Auth", () => {
    expect(getAuthTypeLabel("none")).toBe("No Auth");
  });
});
