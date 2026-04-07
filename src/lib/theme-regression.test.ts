import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const parseThemeVariables = (css: string) => {
  const themeBlock = css.match(/@theme\s*\{([\s\S]*?)\}/)?.[1] ?? "";

  return Object.fromEntries(
    Array.from(themeBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)).map((match) => {
      const [, name = "", value = ""] = match;
      return [`--${name}`, value.trim()];
    }),
  );
};

const getGradientColors = (css: string) => {
  const gradientDeclaration = css
    .split("\n")
    .find((line) => line.includes("radial-gradient(circle at top")) ?? "";

  return Array.from(gradientDeclaration.matchAll(/rgba?\([^)]*\)/g)).map((match) =>
    match[0].replace(/\s+/g, " ").trim(),
  );
};

describe("global OpenHands theme", () => {
  it("keeps the dashboard palette aligned with OpenHands frontend tokens", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const themeVariables = parseThemeVariables(css);
    const gradientColors = getGradientColors(css);

    expect(themeVariables).toMatchObject({
      "--color-accent": "#c9b974",
      "--color-accent-hover": "#cfb755",
      "--color-accent-foreground": "#0d0f11",
      "--color-bg-active": "#454545",
    });
    expect(gradientColors).toContain("rgba(201, 185, 116, 0.08)");
  });
});
