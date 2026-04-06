import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const parseThemeVariables = (css: string) => {
  const themeBlock = css.match(/@theme\s*\{([\s\S]*?)\}/)?.[1] ?? "";

  return Object.fromEntries(
    Array.from(themeBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)).map(([, name, value]) => [
      `--${name}`,
      value.trim(),
    ]),
  );
};

describe("global OpenHands theme", () => {
  it("keeps the dashboard palette aligned with OpenHands frontend tokens", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const themeVariables = parseThemeVariables(css);

    expect(themeVariables).toMatchObject({
      "--color-accent": "#c9b974",
      "--color-accent-hover": "#cfb755",
      "--color-accent-foreground": "#0d0f11",
      "--color-bg-active": "#454545",
    });
    expect(css).toMatch(/radial-gradient\(circle at top, rgba\(201, 185, 116, 0\.08\), transparent 28%\)/);
  });
});
