import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("global OpenHands theme", () => {
  it("keeps the dashboard palette aligned with OpenHands frontend tokens", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toContain("--color-accent: #c9b974;");
    expect(css).toContain("--color-accent-hover: #cfb755;");
    expect(css).toContain("--color-accent-foreground: #0d0f11;");
    expect(css).toContain("--color-bg-active: #454545;");
    expect(css).toContain("rgba(201, 185, 116, 0.08)");
  });
});
