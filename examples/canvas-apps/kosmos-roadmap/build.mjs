#!/usr/bin/env node
// Builds the installable Canvas App package in dist/: canvas-extension.json
// plus a self-contained extension.js holding the page, the db adapter and the
// data directory it reads.
// Usage: node build.mjs [--data-dir <dir>] [--poll-ms <ms>] [--out <dir>]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_DATA_DIR } from "./sync.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

const manifest = {
  schema_version: 1,
  name: "kosmos-roadmap",
  display_name: "Kosmos™ Roadmap",
  version: "0.1.0",
  description:
    "Schedule, board, pipeline, agents and history for kosmos-engine, from tools/pm/refresh.mjs.",
  entrypoint: "extension.js",
  icon: "icon.svg",
  contributes: {
    pages: [
      {
        id: "roadmap",
        title: "Kosmos™ Roadmap",
        path: "/roadmap",
        nav_label: "Kosmos™ Roadmap",
      },
    ],
  },
};
const config = {
  pageId: "roadmap",
  title: "Kosmos™ Roadmap",
  dataDir: resolve(opt("--data-dir") ?? DEFAULT_DATA_DIR),
  pollMs: Number(opt("--poll-ms") ?? 30000),
};

const read = (file) => readFileSync(join(here, file), "utf8");
const db = read("roadmap-db.js").replace(/^export /gm, "");
const entry = read("entry.js")
  .replace("__PAGE_HTML__", () => JSON.stringify(read("kosmos-gantt.html")))
  .replace("__CONFIG__", () => JSON.stringify(config));

const out = resolve(opt("--out") ?? join(here, "dist"));
mkdirSync(out, { recursive: true });
writeFileSync(
  join(out, "canvas-extension.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
writeFileSync(join(out, "extension.js"), `${db}\n${entry}`);
writeFileSync(join(out, "icon.svg"), read("icon.svg"));
console.log(`Built ${out}\n  data dir: ${config.dataDir}`);
