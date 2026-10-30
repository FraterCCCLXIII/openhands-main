// @vitest-environment jsdom
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

// Build the installable package the way Canvas receives it, then evaluate its entry as a script.
function loadBuiltExtension() {
  const out = mkdtempSync(join(tmpdir(), "kosmos-roadmap-"));
  execFileSync(process.execPath, [join(here, "build.mjs"), "--out", out], { stdio: "pipe" });
  const source = readFileSync(join(out, "extension.js"), "utf8").replace(/^export /gm, "");
  return new Function(`${source}\nreturn { activate };`)();
}

describe("Kosmos roadmap page height", () => {
  it("sizes the page frame to the visible height on mount and again after a window resize", async () => {
    const { activate } = loadBuiltExtension();
    const pages = new Map();
    const missing = () => Object.assign(new Error("missing"), { status: 404 });
    activate({
      apiVersion: "1",
      agentServer: { request: vi.fn(async () => { throw missing(); }) },
      registerPage: (id, mount) => pages.set(id, mount),
    });
    const [mount] = pages.values();
    const container = document.createElement("div");
    document.body.append(container);
    const innerHeight = window.innerHeight;
    window.innerHeight = 900;
    try {
      const stop = mount({ container });
      const frame = container.querySelector("iframe");
      expect(frame.style.height).toBe("900px");
      window.innerHeight = 1200;
      window.dispatchEvent(new Event("resize"));
      expect(frame.style.height).toBe("1200px");
      stop();
    } finally {
      window.innerHeight = innerHeight;
    }
  });
});
