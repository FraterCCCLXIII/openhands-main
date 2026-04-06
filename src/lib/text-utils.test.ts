import { describe, expect, it } from "vitest";

import {
  matchesExactSearchQuery,
  matchesSearchQuery,
  normalizeCaseInsensitiveText,
} from "@/src/lib/text-utils";

describe("text-utils", () => {
  it("normalizes whitespace and casing consistently", () => {
    expect(normalizeCaseInsensitiveText("  Example Value  ")).toBe("example value");
    expect(normalizeCaseInsensitiveText(null)).toBe("");
  });

  it("matches search queries across multiple candidate values", () => {
    expect(
      matchesSearchQuery(["Slack", "Team communication", undefined], " communication "),
    ).toBe(true);
    expect(matchesSearchQuery(["Slack", "Team communication"], "linear")).toBe(false);
    expect(matchesSearchQuery(["Slack"], "   ")).toBe(true);
  });

  it("supports exact matching for normalized values", () => {
    expect(matchesExactSearchQuery(["Slack", "Slack (slack)"], " slack ")).toBe(true);
    expect(matchesExactSearchQuery(["Slack", "Slack (slack)"], "slack (SLACK)")).toBe(true);
    expect(matchesExactSearchQuery(["Slack", "Slack (slack)"], "sla")).toBe(false);
    expect(matchesExactSearchQuery(["Slack"], "   ")).toBe(false);
  });
});
