import { describe, expect, it } from "vitest";

import { metadata } from "./layout";

describe("layout metadata", () => {
  it("points favicon metadata at the OpenHands asset set", () => {
    expect(metadata.icons).toMatchObject({
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
    });
  });
});
