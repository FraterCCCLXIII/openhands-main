// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./page.html", import.meta.url), "utf8");
const vars = Object.fromEntries([...css.matchAll(/--([a-z]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const rgb = (hex) => {
  const h = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, "$&$&").slice(1) : hex.slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lum = (c) => {
  const [r, g, b] = c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("work inventory page colours", () => {
  it("keeps the muted status text and the danger button's hover label at WCAG AA on their backgrounds", () => {
    expect(ratio(rgb(vars.dim), rgb(vars.raised))).toBeGreaterThanOrEqual(4.5);
    // button:hover paints white at the alpha the page declares over the panel.
    const alpha = Number(css.match(/button:hover\s*\{\s*background:\s*rgba\(255,255,255,\s*([.\d]+)\)/)[1]);
    const hoverBg = rgb(vars.panel).map((v) => v * (1 - alpha) + 255 * alpha);
    const dangerHover = css.match(/button\.danger:hover\s*\{\s*color:\s*(#[0-9a-f]{3,6})/i)?.[1] ?? vars.bad;
    expect(ratio(rgb(dangerHover), hoverBg)).toBeGreaterThanOrEqual(4.5);
  });
});
