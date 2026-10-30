import { describe, expect, it } from "vitest";
import { canvasExtensionBannerUrl } from "./canvas-extension-banner";

describe("canvasExtensionBannerUrl", () => {
  it("gives every app a Pexels photo and the same one each time", () => {
    const first = canvasExtensionBannerUrl("some-new-app");
    expect(first).toMatch(/^https:\/\/images\.pexels\.com\/photos\//);
    expect(canvasExtensionBannerUrl("some-new-app")).toBe(first);
  });

  it("keeps built-in apps on different photos", () => {
    expect(canvasExtensionBannerUrl("hangout")).not.toBe(
      canvasExtensionBannerUrl("meet"),
    );
  });
});
