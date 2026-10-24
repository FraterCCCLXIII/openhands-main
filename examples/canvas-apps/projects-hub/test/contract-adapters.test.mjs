// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { makeSnapshot, STATUSES, validateSnapshot } from "../contract/contract.mjs";
import { collectKosmos, fromRefresh } from "../adapters/kosmos.mjs";
import { fromGithub, readLabels } from "../adapters/github.mjs";
import { collectUsage } from "../adapters/usage.mjs";
import { githubRaw, KOSMOS, kosmosRefresh, YAKOPOP } from "./fixtures.mjs";

const tmp = [];
afterEach(() => tmp.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));
const mkTmp = () => {
  const d = mkdtempSync(join(tmpdir(), "pm-hub-test-"));
  tmp.push(d);
  return d;
};
const statusOf = (snap, name) => Object.fromEntries(Object.values(snap.collections[name]).map((d) => [d.id ?? d.card, d.status]));

describe("snapshot contract", () => {
  it("accepts an adapter's snapshot and stamps every document with the project", () => {
    const snap = makeSnapshot(KOSMOS, fromRefresh(kosmosRefresh(), KOSMOS), [{ adapter: "kosmos", at: new Date().toISOString() }]);
    expect(validateSnapshot(snap)).toEqual([]);
    const docs = Object.values(snap.collections).flatMap((c) => Object.values(c));
    expect(docs.every((d) => d.project === KOSMOS.id)).toBe(true);
  });

  it("rejects an unknown status, a foreign project, a missing collection and a bad project id", () => {
    const snap = makeSnapshot(KOSMOS, fromRefresh(kosmosRefresh(), KOSMOS), [{ adapter: "kosmos", at: new Date().toISOString() }]);
    snap.collections.cards["RND.L2"].status = "todo";
    snap.collections.runs["agt-r3"].project = YAKOPOP.id;
    snap.collections.history["prs-01"].items[0].status = "merged";
    delete snap.collections.calendar;
    const errors = validateSnapshot(snap);
    expect(errors.join("\n")).toMatch(/cards\.RND\.L2\.status: "todo" is not one of/);
    expect(errors.join("\n")).toMatch(/runs\/agt-r3: project Modern-Telepathy\/yakopop is not/);
    expect(errors.join("\n")).toMatch(/prs-01\.items\[0\]\.status/);
    expect(errors.join("\n")).toMatch(/missing calendar/);
    expect(validateSnapshot({ ...snap, project: { ...KOSMOS, id: "no-slash" } }).join("\n")).toMatch(/project\.id/);
  });

  it("has the six board columns as its statuses", () => {
    expect(STATUSES).toEqual(["backlog", "ready", "building", "verify", "blocked", "done"]);
  });
});

describe("kosmos adapter", () => {
  it("maps registry status, the ready flag and open asks to contract statuses", () => {
    const snap = makeSnapshot(KOSMOS, fromRefresh(kosmosRefresh(), KOSMOS), []);
    expect(statusOf(snap, "cards")).toEqual({ "RND.L1": "done", "RND.L2": "ready", "AGT.R3": "building", "ORC.PM5": "verify", "PLT.go": "blocked", "VOX.9": "backlog" });
    expect(snap.collections.cards["RND.L2"]).toMatchObject({ sourceStatus: "todo", deps: ["RND.L1"], flags: ["crit"], track: "render" });
  });

  it("normalizes runs, PRs, issues, costs and calendar landings", () => {
    const c = fromRefresh(kosmosRefresh(), KOSMOS);
    expect(c.runs["rnd-l1"].status).toBe("done");
    expect(c.runs["agt-r3"].status).toBe("building");
    expect(c.history["prs-01"].items.map((p) => p.status)).toEqual(["done", "verify"]);
    expect(c.history.issues.items[0].status).toBe("done");
    expect(c.costs.summary).toMatchObject({ total: 100, byStatus: { done: 12.5, building: 3 } });
    expect(c.costs["session-aaaa1111"].status).toBe("done");
    expect(c.calendar["2026-10"].days[0].events).toEqual([{ ref: "RND.L1", status: "done" }]);
    expect(c.meta.costs).toBeUndefined();
    expect(Object.keys(c.lanes)).toEqual(["render"]);
  });

  it("packs a refresh.mjs --out folder", () => {
    const out = mkTmp();
    const writes = Object.entries(kosmosRefresh()).flatMap(([collection, docs]) =>
      Object.entries(docs).map(([doc_id, data]) => {
        const file_path = join(out, `${collection}-${doc_id}.json`);
        writeFileSync(file_path, JSON.stringify(data));
        return { op: "set", collection, doc_id, file_path };
      }),
    );
    writeFileSync(join(out, "batch-1.json"), JSON.stringify(writes));
    const snap = collectKosmos(KOSMOS, { from: out });
    expect(validateSnapshot(snap)).toEqual([]);
    expect(Object.keys(snap.collections.cards)).toHaveLength(6);
    expect(snap.project.branch).toBe("proto");
  });
});

describe("github adapter", () => {
  const collections = () => fromGithub(githubRaw(), YAKOPOP);

  it("reads status, tier, size and kind labels", () => {
    expect(readLabels(["bug", "Ready-For-Dev", "size: s", "T3", "area: ui"])).toEqual({ status: "ready", tier: 3, size: "S", kind: "fix", rest: ["area: ui"] });
    expect(readLabels(["wip"], { building: ["wip"] }).status).toBe("building");
  });

  it("turns issues and lone PRs into cards with contract statuses", () => {
    const c = collections();
    expect(Object.fromEntries(Object.values(c.cards).map((x) => [x.id, x.status]))).toEqual({
      "GH.1": "ready", "GH.2": "blocked", "GH.4": "building", "GH.5": "verify", "GH.6": "blocked", "GH.3": "done", "PR.22": "building",
    });
    expect(c.cards["GH.1"]).toMatchObject({ track: "Beta", kind: "fix", size: "S", deps: ["GH.3"], url: "https://github.com/Modern-Telepathy/yakopop/issues/1" });
    expect(c.cards["GH.4"].tier).toBe(3);
    expect(c.cards["GH.2"].ask).toBe("Godot or our own?");
    expect(c.cards["PR.21"]).toBeUndefined();
  });

  it("records PRs, runs, days, rows and calendar events", () => {
    const c = collections();
    const prs = c.history["prs-01"].items;
    expect(prs.map((p) => [p.n, p.st, p.status, p.card])).toEqual([[20, "M", "done", "GH.3"], [21, "O", "verify", "GH.5"], [22, "O", "building", "PR.22"]]);
    expect(prs[0].h).toBe(36);
    expect(c.runs["pr-20"]).toMatchObject({ card: "GH.3", status: "done", claimToLandH: 36 });
    expect(c.history.days.items.find((d) => d.d === "2026-10-10")).toMatchObject({ commits: 1, merges: 1, prsMerged: 1 });
    expect(c.history.days.items.find((d) => d.d === "2026-10-11").reverts).toBe(1);
    expect(Object.values(c.rows).map((r) => [r.group, r.title])).toEqual([["Milestones", "Beta"], ["In flight", "#21 Work on #5"], ["In flight", "#22 Standalone tweak"], ["Waiting on you", "GH.2 · Pick an engine"]]);
    expect(c.rows["ms-1"].progress).toBe(50);
    const events = Object.values(c.calendar).flatMap((m) => m.days.flatMap((d) => d.events));
    expect(events).toEqual(expect.arrayContaining([{ ref: "#20", status: "done" }, { ref: "GH.3", status: "done" }, { ref: "#22", status: "verify" }]));
    expect(validateSnapshot(makeSnapshot(YAKOPOP, c, []))).toEqual([]);
  });
});

describe("usage adapter", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  // A kosmos-engine checkout next to this repo, when there is one.
  const pmTools = [process.env.PM_TOOLS, resolve(here, "../../../../../../kosmos-engine-proto/tools/pm")].find((p) => p && existsSync(join(p, "usage.mjs")));

  it("shapes a scan into costs/summary and calendar months, with the git counts left to the repo's adapter", async () => {
    const scan = {
      files: 1, calls: 2, byModel: { m1: { calls: 2, input: 1, w5: 2, w1h: 0, read: 10, out: 4, think: 1, cost: 3 } }, ctxB: { m1: { "<50k": { input: 1, w5: 2, w1h: 0, read: 10, out: 4 } } },
      ctxAll: { "<50k": { calls: 2, cost: 3, input: 1, w5: 2, w1h: 0, read: 10, out: 4 } }, byDay: { "2026-10-20": { m1: { cost: 3 } } }, byEffort: { "m1|high": { calls: 2 } },
      streams: [{ sub: false, cost: 3, calls: 2, mins: 5, maxCtx: 13 }], local: {},
    };
    const tools = {
      prices: [{ id: "m1", name: "M1", input: 1, output: 1, cacheRead: 1, write5m: 1, write1h: 1 }], BUCKETS: ["<50k"], BUCKET_MID: { "<50k": 30e3 },
      priceTokens: (p, t) => (t.input ?? 0) + (t.w5 ?? 0) + (t.read ?? 0) + (t.out ?? 0), transcriptDirs: () => ["/dir"], scanTranscripts: async () => scan,
      calendar: (w) => w.put("calendar", "2026-10", { month: "2026-10", days: [{ d: "2026-10-20", calls: 2, cost: 3, landed: ["X"], commits: 9, prsMerged: 1 }] }),
    };
    const snap = await collectUsage(YAKOPOP, { tools });
    expect(snap.collections.costs.summary).toMatchObject({ total: 3, calls: 2, composition: { input: 1, w5: 2, read: 10, out: 4 }, cardJoin: { cards: 0 } });
    expect(snap.collections.calendar["2026-10"].days[0]).toMatchObject({ calls: 2, landed: [], commits: 0, prsMerged: 0 });
    expect(Object.keys(snap.collections.prices)).toEqual(["m1"]);
  });

  it.skipIf(!pmTools)("reads a repo's transcripts with kosmos-engine's tools/pm", async () => {
    const repo = mkTmp(), dir = mkTmp();
    const git = (args) => import("node:child_process").then(({ execFileSync }) => execFileSync("git", args, { cwd: repo }));
    await git(["init", "-q"]);
    mkdirSync(join(dir, "s1"));
    const line = (id, t) => JSON.stringify({ type: "assistant", sessionId: "s1", timestamp: t, message: { id, model: "claude-opus-5-5", usage: { input_tokens: 10, cache_read_input_tokens: 1000, output_tokens: 50 } } });
    writeFileSync(join(dir, "s1", "a.jsonl"), [line("m1", "2026-10-20T09:00:00Z"), line("m1", "2026-10-20T09:00:00Z"), line("m2", "2026-10-21T09:00:00Z")].join("\n"));
    const snap = await collectUsage({ ...YAKOPOP, path: repo }, { pmTools, transcripts: dir });
    expect(snap.collections.costs.summary.calls).toBe(2);
    expect(Object.keys(snap.collections.calendar)).toEqual(["2026-10"]);
    expect(validateSnapshot({ ...snap, collections: { cards: {}, runs: {}, history: {}, ...snap.collections } })).toEqual([]);
  });
});
