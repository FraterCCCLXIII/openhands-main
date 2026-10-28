#!/usr/bin/env node
// Packs the documents kosmos-engine's `tools/pm/refresh.mjs` wrote into the
// snapshot.json the Kosmos Roadmap app reads.
// Usage:
//   node sync.mjs --from <refresh --out dir>      pack an existing refresh
//   node sync.mjs --engine <kosmos-engine checkout> [--offline]
//                                                  run refresh there, then pack
//   [--data-dir <dir>]  where snapshot.json goes (default ~/.openhands/kosmos-roadmap)
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_DATA_DIR = join(homedir(), ".openhands", "kosmos-roadmap");

/** Reads refresh's batch-*.json files ({op, collection, doc_id, file_path}). */
export function packRefreshOutput(outDir) {
  const batches = readdirSync(outDir)
    .filter((name) => /^batch-\d+\.json$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  if (batches.length === 0)
    throw new Error(`No batch-*.json files in ${outDir}.`);
  const collections = {};
  let documents = 0;
  for (const batch of batches) {
    for (const write of JSON.parse(readFileSync(join(outDir, batch), "utf8"))) {
      const docs = (collections[write.collection] ??= {});
      if (write.op === "delete") {
        delete docs[write.doc_id];
        continue;
      }
      const data = JSON.parse(readFileSync(write.file_path, "utf8"));
      docs[write.doc_id] =
        write.op === "update" ? { ...docs[write.doc_id], ...data } : data;
      documents += 1;
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    source: outDir,
    documents,
    collections,
  };
}

export function writeSnapshot(dataDir, snapshot) {
  mkdirSync(dataDir, { recursive: true });
  const target = join(dataDir, "snapshot.json");
  // Write then rename so the app never reads a half-written file.
  writeFileSync(`${target}.tmp`, JSON.stringify(snapshot));
  renameSync(`${target}.tmp`, target);
  // The app reads local.json on every poll; an empty one saves a 404 each time.
  const local = join(dataDir, "local.json");
  if (!existsSync(local))
    writeFileSync(local, JSON.stringify({ collections: {} }));
  return target;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const opt = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const dataDir = resolve(opt("--data-dir") ?? DEFAULT_DATA_DIR);
  let from = opt("--from");
  const engine = opt("--engine");
  if (!from && !engine) {
    console.error(
      "Pass --from <refresh output dir> or --engine <kosmos-engine checkout>.",
    );
    process.exit(2);
  }
  if (!from) {
    from = mkdtempSync(join(tmpdir(), "kosmos-pm-"));
    const args = [
      "tools/pm/refresh.mjs",
      "--out",
      from,
      ...(argv.includes("--offline") ? ["--offline"] : []),
    ];
    execFileSync(process.execPath, args, {
      cwd: resolve(engine),
      stdio: "inherit",
    });
  }
  const snapshot = packRefreshOutput(resolve(from));
  const target = writeSnapshot(dataDir, snapshot);
  const counts = Object.entries(snapshot.collections).map(
    ([name, docs]) => `${name} ${Object.keys(docs).length}`,
  );
  console.log(
    `${snapshot.documents} documents -> ${target}\n  ${counts.join(", ")}`,
  );
}
