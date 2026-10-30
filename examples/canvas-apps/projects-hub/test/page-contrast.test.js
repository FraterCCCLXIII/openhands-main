// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../page.html", import.meta.url), "utf8");
const vars = Object.fromEntries([...css.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{3,6})\b/gi)].map((m) => [m[1], m[2]]));
const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(1).padEnd(6, "0").slice(i, i + 2), 16));
const lum = (c) => {
  const [r, g, b] = c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("projects hub page colours", () => {
  it("keeps the planned-role chip readable both as a filled chip (panel text) and as an outlined one (planned text on panel)", () => {
    expect(ratio(rgb(vars.planned), rgb(vars.panel))).toBeGreaterThanOrEqual(4.5);
  });
});
