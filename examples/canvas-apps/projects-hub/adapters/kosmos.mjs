// Adapter for kosmos-style repos: runs the repo's own `tools/pm/refresh.mjs`
// and normalizes its documents into the snapshot contract (CONTRACT.md).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeSnapshot } from "../contract/contract.mjs";

export const NAME = "kosmos";
// Collections refresh.mjs writes that the contract carries as they are.
const PASSTHROUGH = ["rows", "lanes", "jobs", "actions", "sessions", "prices", "cardstats"];

/** Reads refresh's batch-*.json files ({op, collection, doc_id, file_path}) into collections. */
export function packRefreshOutput(outDir) {
  const batches = readdirSync(outDir)
    .filter((name) => /^batch-\d+\.json$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  if (batches.length === 0) throw new Error(`No batch-*.json files in ${outDir}.`);
  const collections = {};
  for (const batch of batches) {
    for (const write of JSON.parse(readFileSync(join(outDir, batch), "utf8"))) {
      const docs = (collections[write.collection] ??= {});
      if (write.op === "delete") {
        delete docs[write.doc_id];
        continue;
      }
      const data = JSON.parse(readFileSync(write.file_path, "utf8"));
      docs[write.doc_id] = write.op === "update" ? { ...docs[write.doc_id], ...data } : data;
    }
  }
  return collections;
}

// tasks/*.jsonl status (plus the queue's ready flag and an open ask) -> contract status.
export function cardStatus(c) {
  if (c.s === "done") return "done";
  if (c.s === "claimed") return "building";
  if (c.s === "in-pr") return "verify";
  if (c.s === "blocked" || c.ask) return "blocked";
  return c.r ? "ready" : "backlog";
}

export function runStatus(r) {
  if (r.landed) return "done";
  if (r.done || r.pr) return "verify";
  if (/fail|error/i.test(r.status ?? "")) return "blocked";
  return r.claimed ? "building" : "backlog";
}

const PR_STATUS = { M: "done", O: "verify", C: "done" };

/** refresh.mjs collections -> contract collections. */
export function fromRefresh(col, project) {
  const cards = {};
  for (const chunk of Object.values(col.registry ?? {}))
    for (const c of chunk.cards ?? []) {
      cards[c.id] = {
        id: c.id, title: c.t, status: cardStatus(c), sourceStatus: c.s, track: c.track, tier: c.tier, kind: c.kind,
        size: c.size, deps: c.deps ?? [], flags: c.f ?? [], ask: c.ask, gate: c.gate, plan: c.plan || undefined,
      };
    }
  const statusOf = (id) => cards[id]?.status;

  const runs = {};
  for (const [id, r] of Object.entries(col.runs ?? {})) runs[id] = { ...r, sourceStatus: r.status, status: runStatus(r) };

  const history = {};
  for (const [id, d] of Object.entries(col.history ?? {})) {
    if (d.kind === "prs") history[id] = { ...d, items: d.items.map((p) => ({ ...p, status: PR_STATUS[p.st] ?? "verify" })) };
    else if (d.kind === "issues") history[id] = { ...d, items: d.items.map((x) => ({ ...x, status: /closed/i.test(x.st) ? "done" : "backlog" })) };
    else history[id] = d;
  }

  const costs = {};
  const summary = col.meta?.costs;
  if (summary) {
    const byStatus = {};
    for (const chunk of Object.values(col.cardstats ?? {}))
      for (const s of chunk.cards ?? []) {
        const st = statusOf(s.id);
        if (st && s.m?.cost) byStatus[st] = +((byStatus[st] ?? 0) + s.m.cost).toFixed(2);
      }
    costs.summary = { ...summary, byStatus };
  }
  for (const [id, j] of Object.entries(col.cardcost ?? {})) {
    const st = (j.cards ?? []).map(statusOf).filter(Boolean);
    costs[`session-${id}`] = { ...j, status: st.find((s) => s !== "done") ?? st[0] ?? "done" };
  }

  const calendar = {};
  for (const [id, m] of Object.entries(col.calendar ?? {}))
    calendar[id] = { ...m, days: m.days.map((d) => ({ ...d, events: (d.landed ?? []).map((ref) => ({ ref, status: "done" })) })) };

  const meta = { ...col.meta };
  delete meta.costs;
  const out = { cards, runs, history, costs, calendar, meta };
  for (const name of PASSTHROUGH) if (col[name]) out[name] = col[name];
  return out;
}

/**
 * @param {object} project hub.json project ({ id, org, repo, path, ... })
 * @param {{ offline?: boolean, from?: string, legacy?: string }} [options]
 *   `from`: an existing refresh --out dir; `legacy`: a kosmos-roadmap
 *   snapshot.json ({ collections }) written by that app's sync.mjs.
 */
export function collectKosmos(project, { offline = false, from, legacy } = {}) {
  let col, note;
  if (legacy) {
    col = JSON.parse(readFileSync(legacy, "utf8")).collections;
    note = `from ${legacy}`;
  } else if (from) {
    col = packRefreshOutput(from);
    note = `from ${from}`;
  } else {
    const out = mkdtempSync(join(tmpdir(), "pm-hub-kosmos-"));
    try {
      execFileSync(process.execPath, ["tools/pm/refresh.mjs", "--out", out, ...(offline ? ["--offline"] : [])], { cwd: project.path, stdio: ["ignore", "ignore", "inherit"] });
      col = packRefreshOutput(out);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
    note = "tools/pm/refresh.mjs";
  }
  const collections = fromRefresh(col, project);
  const documents = Object.values(collections).reduce((s, d) => s + Object.keys(d).length, 0);
  return makeSnapshot({ ...project, branch: project.branch ?? "proto" }, collections, [{ adapter: NAME, at: new Date().toISOString(), documents, note }]);
}
