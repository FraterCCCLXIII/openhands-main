#!/usr/bin/env node
// Builds the installable Canvas App package in dist/ (canvas-extension.json,
// a self-contained extension.js, icon.svg) and a standalone work-inventory.html
// that embeds the current snapshot, for opening straight from disk.
// Usage: node build.mjs [--data-dir <dir>] [--poll-ms <ms>] [--out <dir>]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
  name: "work-inventory",
  display_name: "Work Inventory",
  version: "0.1.0",
  description:
    "Every local branch, stash and worktree with push state, status, owner, tags and notes you can sort and edit.",
  entrypoint: "extension.js",
  icon: "icon.svg",
  contributes: {
    pages: [
      {
        id: "inventory",
        title: "Work Inventory",
        path: "/inventory",
        nav_label: "Work Inventory",
      },
    ],
  },
};
const dataDir = resolve(opt("--data-dir") ?? DEFAULT_DATA_DIR);
const config = {
  pageId: "inventory",
  title: "Work Inventory",
  dataDir,
  pollMs: Number(opt("--poll-ms") ?? 30000),
};

const read = (file) => readFileSync(join(here, file), "utf8");
const db = read("inventory-db.js").replace(/^export /gm, "");
const page = read("page.html");
const entry = read("entry.js")
  .replace("__PAGE_HTML__", () => JSON.stringify(page))
  .replace("__CONFIG__", () => JSON.stringify(config));

const out = resolve(opt("--out") ?? join(here, "dist"));
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "canvas-extension.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(out, "extension.js"), `${db}\n${entry}`);
writeFileSync(join(out, "icon.svg"), read("icon.svg"));

const snapshotFile = join(dataDir, "snapshot.json");
if (existsSync(snapshotFile)) {
  // "<" is escaped so branch names or notes can never close the script tag.
  const seed = readFileSync(snapshotFile, "utf8").replace(/</g, "\\u003c");
  writeFileSync(
    join(out, "work-inventory.html"),
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n<script id="seed" type="application/json">${seed}</script>\n${page}`,
  );
}
console.log(`Built ${out}\n  data dir: ${dataDir}${existsSync(snapshotFile) ? "\n  standalone: work-inventory.html" : "\n  (no snapshot yet: run sync.mjs, then build again for the standalone file)"}`);
