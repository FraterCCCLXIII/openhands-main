import { describe, expect, it } from "vitest";
import {
  APP_BANNER_PALETTE,
  appBannerBackground,
  appBannerStops,
  contrastWithWhite,
} from "./app-banner-gradient";

describe("app banner gradients", () => {
  it("keeps white readable on every palette stop", () => {
    for (const stops of APP_BANNER_PALETTE) {
      for (const stop of stops) {
        expect(contrastWithWhite(stop)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("keeps white readable on stops derived from bright accent colours", () => {
    for (const accent of ["#F59E0B", "#EAB308", "#84CC16", "#ffffff"]) {
      for (const stop of appBannerStops("x", accent)) {
        expect(contrastWithWhite(stop)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("is deterministic per name and varies between names", () => {
    expect(appBannerBackground("meet")).toBe(appBannerBackground("meet"));
    const backgrounds = new Set(
      [
        "meet",
        "hangout",
        "projects-hub",
        "learning-center",
        "run-timeline",
      ].map((n) => appBannerBackground(n)),
    );
    expect(backgrounds.size).toBeGreaterThan(2);
  });

  it("is a gradient, never an image URL", () => {
    expect(appBannerBackground("meet", "#3B82F6")).toMatch(
      /linear-gradient\(135deg/,
    );
    expect(appBannerBackground("meet")).not.toContain("url(");
  });
});
