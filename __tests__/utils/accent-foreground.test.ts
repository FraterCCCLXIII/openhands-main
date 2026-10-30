import { describe, expect, it } from "vitest";
import {
  parseComputedRgb,
  pickAccentForeground,
} from "#/utils/accent-foreground";

describe("pickAccentForeground", () => {
  it("uses white text on a saturated red button", () => {
    expect(pickAccentForeground([224, 96, 96])).toBe("#FFFFFF");
  });

  it("uses dark text on a pale button", () => {
    expect(pickAccentForeground([240, 240, 240])).toBe("#0F1115");
  });
});

describe("parseComputedRgb", () => {
  it("reads a computed rgb string", () => {
    expect(parseComputedRgb("rgb(10, 20, 30)")).toEqual([10, 20, 30]);
  });

  it("treats a fully transparent background as unknown", () => {
    expect(parseComputedRgb("rgba(0, 0, 0, 0)")).toBeNull();
  });
});
