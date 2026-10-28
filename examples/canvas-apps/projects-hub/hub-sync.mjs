#!/usr/bin/env node
// Refreshes every project in the hub (README.md). Each project's adapter
// writes a snapshot (CONTRACT.md); a project with `usage` also gets the
// Claude Code usage adapter's costs and calendar laid over it.
// Usage:
//   node hub-sync.mjs init                      create hub.json and the hub's hub-sync.mjs launcher
//   node hub-sync.mjs add <path> [--adapter kosmos|github] [--org O] [--repo R] [--name N] [--branch B] [--usage | --no-usage]
//   node hub-sync.mjs remove <org/repo>
//   node hub-sync.mjs list
//   node hub-sync.mjs [sync] [--only <org/repo>,...] [--offline] [--legacy <org/repo>=<kosmos-roadmap snapshot.json>]
//   [--hub <dir>]  the hub data directory (default ~/.openhands/pm-hub)
import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mergeInto, validateSnapshot } from "./contract/contract.mjs";
import { collectGithub } from "./adapters/github.mjs";
import { collectKosmos } from "./adapters/kosmos.mjs";
import { collectUsage } from "./adapters/usage.mjs";
import { addProject, DEFAULT_HUB_DIR, projectFile, projectInfo, readHub, writeHub, writeJsonAtomic } from "./hub/hub.mjs";
import { mergeMonths } from "./rollup.js";

const r2 = (n) => +Number(n || 0).toFixed(2);

/** Fills costs/summary.forecast from the project's own cards when the adapter could not. */
export function finalize(snapshot) {
  const summary = snapshot.collections.costs.summary;
  if (summary && !summary.forecast) {
    const cards = Object.values(snapshot.collections.cards);
    const open = cards.filter((c) => c.status !== "done"), done = cards.length - open.length;
    summary.forecast = { open: open.length, done, allInPerCard: r2(summary.total / Math.max(1, done)), byTier: [1, 2, 3, 4].map((tier) => ({ tier, open: open.filter((c) => c.tier === tier).length })) };
  }
  return snapshot;
}

/** One project's snapshot from its adapter, plus usage when hub.json asks for it. */
export async function collectProject(project, hub, { offline = false, legacy, adapters = {} } = {}) {
  const info = projectInfo(project);
  const kosmos = adapters.kosmos ?? collectKosmos, github = adapters.github ?? collectGithub, usage = adapters.usage ?? collectUsage;
  const snap = project.adapter === "kosmos" ? kosmos(info, { offline, legacy }) : github(info, { offline, labels: project.labels });
  if (project.usage) {
    if (!hub.tools?.pm) throw new Error("hub.json has no tools.pm: add a kosmos-engine checkout first, or set tools.pm to its tools/pm folder.");
    mergeInto(snap, await usage(info, { pmTools: hub.tools.pm }), mergeMonths);
  }
  return finalize(snap);
}

export async function syncHub(hubDir, { only = null, offline = false, legacy = {}, adapters, log = console.log } = {}) {
  const hub = readHub(hubDir);
  const results = [];
  for (const project of hub.projects.filter((p) => !only || only.includes(p.id))) {
    const started = Date.now();
    try {
      const snap = await collectProject(project, hub, { offline, legacy: legacy[project.id], adapters });
      const errors = validateSnapshot(snap);
      if (errors.length) throw new Error(`snapshot breaks the contract: ${errors.slice(0, 5).join("; ")}${errors.length > 5 ? ` (+${errors.length - 5} more)` : ""}`);
      writeJsonAtomic(join(hubDir, projectFile(project.id, "snapshot.json")), JSON.stringify(snap));
      const local = join(hubDir, projectFile(project.id, "local.json"));
      // The app reads local.json on every poll; an empty one saves a 404 each time.
      if (!existsSync(local)) writeJsonAtomic(local, { collections: {} });
      const counts = Object.fromEntries(Object.entries(snap.collections).map(([k, v]) => [k, Object.keys(v).length]));
      project.lastSync = { at: snap.generatedAt, ok: true, ms: Date.now() - started, cards: counts.cards, sources: snap.sources.map((s) => s.adapter) };
      log(`${project.id}: ${counts.cards} cards, ${counts.runs} runs, ${counts.calendar} months (${snap.sources.map((s) => s.note ?? s.adapter).join("; ")})`);
    } catch (error) {
      project.lastSync = { at: new Date().toISOString(), ok: false, ms: Date.now() - started, error: String(error?.message ?? error).slice(0, 400) };
      log(`${project.id}: failed: ${project.lastSync.error}`);
    }
    results.push({ id: project.id, ...project.lastSync });
  }
  writeHub(hubDir, hub);
  return results;
}

// The copy inside the hub dir that the README tells people to run.
const launcher = (here) => `#!/usr/bin/env node
// Refreshes every project in this hub. The code lives in the Projects app:
// ${here}
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const { main } = await import(${JSON.stringify(pathToFileURL(join(here, "hub-sync.mjs")).href)});
await main(process.argv.slice(2), { hubDir: dirname(fileURLToPath(import.meta.url)) });
`;

export async function main(argv, { hubDir: defaultDir } = {}) {
  const opt = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const hubDir = resolve(opt("--hub") ?? defaultDir ?? DEFAULT_HUB_DIR);
  const cmd = argv[0] && !argv[0].startsWith("--") ? argv[0] : "sync";
  if (cmd === "init" || cmd === "add") {
    const hub = readHub(hubDir);
    if (cmd === "add") {
      if (!argv[1]) throw new Error("add needs a checkout path.");
      const usage = argv.includes("--usage") ? true : argv.includes("--no-usage") ? false : undefined;
      const p = addProject(hub, { path: argv[1], adapter: opt("--adapter"), org: opt("--org"), repo: opt("--repo"), name: opt("--name"), branch: opt("--branch"), usage });
      console.log(`${p.id}: ${p.adapter} adapter${p.usage ? " + usage" : ""}, ${p.path}`);
    }
    writeHub(hubDir, hub);
    writeFileSync(join(hubDir, "hub-sync.mjs"), launcher(fileURLToPath(new URL(".", import.meta.url))));
    console.log(`Hub at ${hubDir}: ${hub.projects.length} projects in ${hub.orgs.length} orgs.`);
    return;
  }
  if (cmd === "remove") {
    const hub = readHub(hubDir);
    hub.projects = hub.projects.filter((p) => p.id !== argv[1]);
    hub.orgs = hub.orgs.filter((o) => hub.projects.some((p) => p.org === o.id));
    writeHub(hubDir, hub);
    console.log(`Removed ${argv[1]} from hub.json; its folder under projects/ is left in place.`);
    return;
  }
  if (cmd === "list") {
    for (const p of readHub(hubDir).projects)
      console.log(`${p.id}\t${p.adapter}${p.usage ? "+usage" : ""}\t${p.lastSync ? `${p.lastSync.ok ? "ok" : "failed"} ${p.lastSync.at}` : "never synced"}\t${p.path}`);
    return;
  }
  const legacy = Object.fromEntries((opt("--legacy") ?? "").split(",").filter(Boolean).map((x) => x.split("=")));
  const results = await syncHub(hubDir, { only: opt("--only")?.split(","), offline: argv.includes("--offline"), legacy });
  if (results.some((r) => !r.ok)) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exit(2);
  });
}
