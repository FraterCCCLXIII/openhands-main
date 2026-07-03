import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const parseThemeVariables = (css: string) => {
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? "";

  return Object.fromEntries(
    Array.from(rootBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)).map((match) => {
      const [, name = "", value = ""] = match;
      return [`--${name}`, value.trim()];
    }),
  );
};

describe("global OpenHands theme", () => {
  it("uses the OpenHands-Neo palette with white accent tokens", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const themeVariables = parseThemeVariables(css);

    expect(themeVariables).toMatchObject({
      "--oh-accent": "#ffffff",
      "--oh-accent-hover": "#ececec",
      "--oh-color-primary": "#ffffff",
      "--oh-interactive-active": "var(--cool-grey-800)",
    });
    expect(themeVariables["--color-accent"]).toBe("var(--oh-accent)");
    expect(css).not.toContain("radial-gradient(circle at top");
  });
});
