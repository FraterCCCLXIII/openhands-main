import { describe, expect, it } from "vitest";

import { metadata } from "./layout";

describe("layout metadata", () => {
  it("points favicon metadata at the OpenHands SVG favicon from agent-canvas", () => {
    expect(metadata.icons).toMatchObject({
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      shortcut: "/favicon.svg",
    });
  });
});
