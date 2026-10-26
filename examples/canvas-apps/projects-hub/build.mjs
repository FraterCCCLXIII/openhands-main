#!/usr/bin/env node
// Builds the installable Canvas App package in dist/: canvas-extension.json
// plus a self-contained extension.js holding the page, the hub store and the
// hub dir it reads.
// Usage: node build.mjs [--data-dir <hub dir>] [--poll-ms <ms>] [--out <dir>]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_HUB_DIR } from "./hub/hub.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

const manifest = {
  schema_version: 1,
  name: "projects-hub",
  display_name: "Projects",
  version: "0.1.0",
  description: "Schedule, board, pipeline, agents, costs and history for every repo in the hub, by organization and project.",
  entrypoint: "extension.js",
  icon: "icon.svg",
  contributes: {
    pages: [{ id: "projects", title: "Projects", path: "/projects", nav_label: "Projects" }],
  },
};
const config = {
  pageId: "projects",
  title: "Projects",
  dataDir: resolve(opt("--data-dir") ?? DEFAULT_HUB_DIR),
  pollMs: Number(opt("--poll-ms") ?? 30000),
};

const read = (file) => readFileSync(join(here, file), "utf8");
// The browser modules share one scope in the bundle: drop their imports and
// the export keyword, in dependency order.
const modules = ["rollup.js", "hub-router.js", "hub-db.js"]
  .map((f) => read(f).replace(/^import .*;\n/gm, "").replace(/^export /gm, ""))
  .join("\n");
const entry = read("entry.js")
  .replace("__PAGE_HTML__", () => JSON.stringify(read("page.html")))
  .replace("__CONFIG__", () => JSON.stringify(config));

const out = resolve(opt("--out") ?? join(here, "dist"));
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "canvas-extension.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(out, "extension.js"), `${modules}\n${entry}`);
writeFileSync(join(out, "icon.svg"), read("icon.svg"));
console.log(`Built ${out}\n  hub dir: ${config.dataDir}`);
