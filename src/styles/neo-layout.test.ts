import { describe, expect, it } from "vitest";

import {
  hubAppShellClassName,
  hubMainScrollClassName,
} from "@/src/styles/neo-layout";

describe("neo-layout scroll shell", () => {
  it("keeps the app shell full-height so the main column can scroll", () => {
    expect(hubAppShellClassName).toContain("h-screen");
    expect(hubAppShellClassName).toContain("overflow-hidden");
    expect(hubAppShellClassName).not.toContain("items-start");
  });

  it("uses an always-visible scrollbar on the main content column", () => {
    expect(hubMainScrollClassName).toContain("overflow-y-auto");
    expect(hubMainScrollClassName).toContain("custom-scrollbar-always");
    expect(hubMainScrollClassName).toContain("min-h-0");
  });
});
