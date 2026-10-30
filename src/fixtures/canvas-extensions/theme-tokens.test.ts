import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const here = resolve(__dirname);
const hostCss = readFileSync(resolve(here, "../../tailwind.css"), "utf8");
const hostTokens = new Set(
  [...hostCss.matchAll(/(--oh-[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
);

// A fixture that reads a theme token the host never defines silently falls back
// to its hard-coded colour (white text on a light theme's white page).
describe("canvas extension fixtures", () => {
  it.each(["pullboard", "tamagotchi", "demo-page", "research-hub"])(
    "%s only reads theme tokens the host defines",
    (name) => {
      const source = readFileSync(resolve(here, name, "extension.js"), "utf8");
      const used = new Set(
        [...source.matchAll(/var\((--oh-[a-z0-9-]+)/g)].map((m) => m[1]),
      );
      const undefinedTokens = [...used].filter((t) => !hostTokens.has(t));
      expect(undefinedTokens).toEqual([]);
    },
  );
});
