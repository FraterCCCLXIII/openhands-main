// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { makeSnapshot } from "../contract/contract.mjs";
import { fromRefresh } from "../adapters/kosmos.mjs";
import { fromGithub } from "../adapters/github.mjs";
import { rollup, stripRefs } from "../rollup.js";
import { createHubDb, overlay } from "../hub-db.js";
import { normalizeRefs, pickProject } from "../hub-router.js";
import { clearApplied, planGithub } from "../apply.mjs";
import { finalize, syncHub } from "../hub-sync.mjs";
import { addProject, emptyHub } from "../hub/hub.mjs";
import { githubRaw, KOSMOS, kosmosRefresh, memoryStorage, OPENHANDS, YAKOPOP } from "./fixtures.mjs";

const kosmosSnap = () => makeSnapshot(KOSMOS, fromRefresh(kosmosRefresh(), KOSMOS), []);
const yakSnap = () => makeSnapshot(YAKOPOP, fromGithub(githubRaw(), YAKOPOP), []);
const usageMonth = (cost) => ({ month: "2026-10", days: [{ d: "2026-10-18", runs: 2, subagents: 1, calls: 5, tokens: 50, cost, out: 5, hours: Array(24).fill(1), models: { sonnet: { calls: 5, cost, tokens: 50 } }, items: [{ item: "x", calls: 5, cost }], sessions: [], landed: [], prsMerged: 0, commits: 0 }] });
const entries = () => {
  const y = yakSnap();
  y.collections.calendar["2026-10"].days.push(usageMonth(2).days[0]);
  y.collections.costs.summary = { ...kosmosRefresh().meta.costs, total: 50, calls: 100, forecast: { open: 6, done: 1, byTier: [{ tier: 2, open: 6 }] } };
  return [kosmosSnap(), y].map((s) => ({ project: s.project, collections: s.collections, snapshot: s.collections }));
};
const cardsOf = (col) => Object.values(col.registry).flatMap((c) => c.cards);

describe("rollup", () => {
  it("keeps one project's own ids and turns statuses back into the page's registry fields", () => {
    const { collections: c, projects } = rollup(entries(), KOSMOS.id);
    expect(projects.map((p) => p.id)).toEqual([KOSMOS.id]);
    expect(cardsOf(c).map((x) => [x.id, x.s, x.r])).toEqual([["RND.L1", "done", 0], ["RND.L2", "todo", 1], ["AGT.R3", "claimed", 0], ["ORC.PM5", "in-pr", 0], ["PLT.go", "blocked", 0], ["VOX.9", "todo", 0]]);
    expect(c.meta.costs.total).toBe(100);
    expect(c.cardcost.aaaa1111.cards).toEqual(["RND.L1"]);
    expect(c.history["prs-01"].items[0].url).toBe("https://github.com/Modern-Telepathy/kosmos-engine/pull/10");
  });

  it("prefixes ids and sums boards, costs, calendar days and history across projects", () => {
    const { collections: c, keys } = rollup(entries(), "all");
    expect(keys.get(YAKOPOP.id)).toBe("yakopop");
    const cards = cardsOf(c);
    expect(cards.find((x) => x.id === "kosmos-engine:RND.L2")).toMatchObject({ deps: ["kosmos-engine:RND.L1"], track: "kosmos-engine/render" });
    expect(cards.find((x) => x.id === "yakopop:GH.1").track).toBe("yakopop/Beta");
    expect(c.meta.board).toMatchObject({ proto: "2 projects", cards: 13, done: 2 });
    expect(c.meta.costs).toMatchObject({ total: 150, calls: 300, forecast: { open: 11, done: 2, allInPerCard: 75 } });
    expect(c.meta.costs.days.find((d) => d.d === "2026-10-18").byModel["claude-opus-5-5"]).toBe(80);
    const d18 = c.calendar["2026-10"].days.find((d) => d.d === "2026-10-18");
    expect(d18).toMatchObject({ runs: 3, calls: 15, cost: 3.5, landed: ["kosmos-engine:RND.L1"] });
    expect(d18.models).toEqual({ opus: { calls: 10, cost: 1.5, tokens: 1000 }, sonnet: { calls: 5, cost: 2, tokens: 50 } });
    expect(d18.hours[9]).toBe(11);
    const prs = c.history["prs-01"].items;
    expect(prs.map((p) => p.card)).toEqual(["yakopop:GH.3", "yakopop:GH.5", "yakopop:PR.22", "kosmos-engine:RND.L1", "kosmos-engine:ORC.PM5"]);
    expect(c.meta.history).toMatchObject({ prs: 5, merged: 2 });
    expect(c.rows["kosmos-engine_row-a"]).toMatchObject({ title: "kosmos-engine · PLT.go · Go or no-go", cards: ["kosmos-engine:PLT.go"] });
    expect(Object.keys(c.prices)).toEqual(["claude-opus-5-5"]);
  });

  it("filters to one organization", () => {
    const more = [...entries(), { project: OPENHANDS, collections: { cards: {}, runs: {}, history: {}, costs: {}, calendar: {} } }];
    expect(rollup(more, "org:Modern-Telepathy").projects.map((p) => p.repo)).toEqual(["kosmos-engine", "yakopop"]);
    expect(rollup(more, "org:FraterCCCLXIII").projects.map((p) => p.repo)).toEqual(["openhands-main"]);
  });

  it("strips the prefixes a page write carries", () => {
    expect(stripRefs({ card: "yakopop:GH.1", track: "yakopop/Beta", title: "yakopop · Row", deps: ["yakopop:GH.3"], project: YAKOPOP.id }, "yakopop"))
      .toEqual({ card: "GH.1", track: "Beta", title: "Row", deps: ["GH.3"], project: YAKOPOP.id });
  });
});

const hubFiles = () => {
  const [k, y] = [kosmosSnap(), yakSnap()];
  return {
    "hub.json": JSON.stringify({ ...emptyHub(), orgs: [{ id: "Modern-Telepathy", name: "Modern Telepathy" }], projects: [{ ...KOSMOS, lastSync: { ok: true } }, { ...YAKOPOP, lastSync: { ok: false } }] }),
    [`projects/${KOSMOS.id}/snapshot.json`]: JSON.stringify(k),
    [`projects/${YAKOPOP.id}/snapshot.json`]: JSON.stringify(y),
    [`projects/${YAKOPOP.id}/local.json`]: JSON.stringify({ collections: { cardstate: { "GH.6": { card: "GH.6", col: "ready" } } } }),
  };
};
const next = (db, name) => new Promise((res, rej) => { const off = db.collection(name).onSnapshot((s) => { off(); res(s); }, rej); });

describe("hub store", () => {
  it("lays each project's local.json over its snapshot and follows the scope", async () => {
    const store = createHubDb(memoryStorage(hubFiles()), { pollMs: 0 });
    const all = await next(store.db, "cardstate");
    expect(all.docs.map((d) => [d.id, d.data().card])).toEqual([["yakopop_GH.6", "yakopop:GH.6"]]);
    store.hub.setScope(KOSMOS.id);
    expect((await next(store.db, "registry")).docs[0].data().cards[0].id).toBe("RND.L1");
    expect(store.hub.info()).toMatchObject({ scope: KOSMOS.id, orgs: [{ id: "Modern-Telepathy" }] });
    expect(store.hub.info().projects.map((p) => [p.key, p.inScope])).toEqual([["kosmos-engine", true], ["yakopop", false]]);
    store.dispose();
  });

  it("writes to the project a document belongs to, with its own ids", async () => {
    const storage = memoryStorage(hubFiles());
    const store = createHubDb(storage, { pollMs: 0 });
    await next(store.db, "cardstate");
    await store.db.collection("cardstate").doc("kosmos-engine_RND.L2").set({ card: "kosmos-engine:RND.L2", col: "building", status: "claimed" });
    await store.db.collection("actions").doc("kosmos-engine:auto-push").update({ done: true });
    await store.db.collection("inbox").doc("r1").set({ id: "r1", project: YAKOPOP.id, route: { card: "yakopop:GH.1", actions: [{ type: "note", card: "yakopop:GH.1", text: "hi" }] } });
    await store.db.collection("cardstate").doc("yakopop_GH.6").delete();
    const local = (id) => JSON.parse(storage.files[`projects/${id}/local.json`]).collections;
    expect(local(KOSMOS.id).cardstate["RND.L2"]).toEqual({ card: "RND.L2", col: "building", status: "claimed", project: KOSMOS.id });
    expect(local(KOSMOS.id).actions["auto-push"]).toMatchObject({ id: "auto-push", title: "Push proto", done: true });
    expect(local(YAKOPOP.id).inbox.r1.route.actions[0].card).toBe("GH.1");
    expect(local(YAKOPOP.id).cardstate["GH.6"]).toBeNull();
    await expect(store.db.collection("rows").doc("row-new").set({ title: "Where?" })).rejects.toThrow(/Pick one project/);
    store.dispose();
  });

  it("writes unprefixed ids when the scope holds one project", async () => {
    const storage = memoryStorage(hubFiles());
    const store = createHubDb(storage, { pollMs: 0, scope: YAKOPOP.id });
    await next(store.db, "rows");
    await store.db.collection("rows").doc("row-new").set({ id: "row-new", title: "Ship beta" });
    expect(JSON.parse(storage.files[`projects/${YAKOPOP.id}/local.json`]).collections.rows["row-new"].title).toBe("Ship beta");
    store.dispose();
  });

  it("reports a missing hub.json to listeners", async () => {
    const store = createHubDb(memoryStorage({}), { pollMs: 0, missingHubMessage: "no hub" });
    await expect(next(store.db, "rows")).rejects.toThrow("no hub");
    expect(overlay({ a: { x: 1, y: 2 } }, { a: { y: null, z: 3 } })).toEqual({ a: { x: 1, z: 3 } });
  });
});

describe("project router", () => {
  const projects = [KOSMOS, YAKOPOP, OPENHANDS].map((p) => ({ ...p, key: p.repo }));
  const cardIds = new Map([[KOSMOS.id, new Set(["RND.L2", "GH.1"])], [YAKOPOP.id, new Set(["GH.1", "PR.22"])], [OPENHANDS.id, new Set(["PR.2"])]]);
  const pick = (text, ctx = {}) => pickProject(text, projects, { cardIds, ...ctx });

  it("takes a project named by repo, path, card prefix or a unique first word", () => {
    expect(pick("add a pause menu to yakopop").project).toBe(YAKOPOP.id);
    expect(pick("fix the build in /repos/OpenHands").project).toBe(OPENHANDS.id);
    expect(pick("note on kosmos-engine:RND.L2").project).toBe(KOSMOS.id);
    expect(pick("kosmos needs a faster renderer").project).toBe(KOSMOS.id);
  });

  it("takes a card id only one project has, then the scope, then the closest cards", () => {
    expect(pick("start RND.L2").project).toBe(KOSMOS.id);
    expect(pick("review #22").project).toBe(YAKOPOP.id);
    expect(pick("start GH.1").project).toBe(null);
    expect(pick("start GH.1", { scope: "org:FraterCCCLXIII" }).project).toBe(OPENHANDS.id);
    expect(pick("tidy the shaders", { similarity: (id) => (id === KOSMOS.id ? 0.6 : 0.1) })).toMatchObject({ project: KOSMOS.id, confidence: 0.55 });
    expect(pick("tidy things", { similarity: () => 0.4 })).toMatchObject({ project: null, alternatives: projects.map((p) => p.id) });
  });

  it("reads #n as the project's issue or PR card", () => {
    expect(normalizeRefs("move #1 and #22 and #9", new Set(["GH.1", "PR.22"]))).toBe("move GH.1 and PR.22 and #9");
  });
});

describe("apply", () => {
  const overlayDoc = {
    collections: {
      cardstate: { "GH.1": { card: "GH.1", col: "building" }, "GH.3": { card: "GH.3", col: "ready" }, "GH.6": { card: "GH.6", col: "done" }, "RND.L2": { card: "RND.L2", col: "done" } },
      decisions: { "GH.2": { card: "GH.2", answer: "Godot", at: "2026-10-23T00:00:00Z" }, "GH.9": { card: "GH.9", answer: "old", applied: true } },
      inbox: { r1: { status: "confirmed", at: "2026-10-23", route: { actions: [{ type: "note", card: "GH.1", text: "Use the new loader" }] } } },
      proposals: { p1: { status: "confirmed", title: "Add a pause menu", note: "From the composer: add a pause menu", gate: "TODO: x", deps: ["GH.1"] } },
    },
  };

  it("plans gh label moves, closes, comments and new issues for a GitHub project", () => {
    const { steps, skipped } = planGithub(overlayDoc, YAKOPOP, { current: { "GH.1": ["ready-for-dev", "bug"], "GH.3:closed": true } });
    expect(steps.map((s) => s.args.join(" "))).toEqual([
      "issue edit 1 --repo Modern-Telepathy/yakopop --add-label in progress --remove-label ready-for-dev",
      "issue reopen 3 --repo Modern-Telepathy/yakopop",
      "issue edit 3 --repo Modern-Telepathy/yakopop --add-label ready-for-dev",
      "issue close 6 --repo Modern-Telepathy/yakopop",
      "issue comment 2 --repo Modern-Telepathy/yakopop --body Decision (2026-10-23): Godot",
      "issue comment 1 --repo Modern-Telepathy/yakopop --body Note (2026-10-23): Use the new loader",
      "",
      "issue create --repo Modern-Telepathy/yakopop --title Add a pause menu --body From the composer: add a pause menu\nDepends on #1",
    ]);
    expect(skipped).toEqual(["cardstate/RND.L2: RND.L2 is not a GitHub issue or PR"]);
  });

  it("marks what ran in local.json", () => {
    const o = structuredClone(overlayDoc);
    clearApplied(o, [{ mark: ["cardstate", "GH.1", "delete"] }, { mark: ["decisions", "GH.2", "applied"] }, { mark: ["proposals", "p1", "status"], created: "GH.30" }]);
    expect(o.collections.cardstate["GH.1"]).toBeNull();
    expect(o.collections.decisions["GH.2"].applied).toBe(true);
    expect(o.collections.proposals.p1).toMatchObject({ status: "applied", card: "GH.30" });
  });
});

describe("hub-sync", () => {
  const dirs = [];
  afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

  it("writes each project's snapshot and local.json, records the last sync, and keeps the old snapshot when one fails", async () => {
    const hubDir = mkdtempSync(join(tmpdir(), "pm-hub-sync-"));
    dirs.push(hubDir);
    const hub = { ...emptyHub(), tools: { pm: "/pm" }, orgs: [{ id: "Modern-Telepathy" }], projects: [{ ...KOSMOS, usage: false }, { ...YAKOPOP, usage: true }] };
    writeFileSync(join(hubDir, "hub.json"), JSON.stringify(hub));
    const usage = async (p) => makeSnapshot(p, { costs: { summary: { total: 4, calls: 8 } }, calendar: { "2026-10": usageMonth(4) } }, [{ adapter: "usage", at: new Date().toISOString() }]);
    const adapters = { kosmos: () => kosmosSnap(), github: () => yakSnap(), usage };
    const results = await syncHub(hubDir, { adapters, log: () => {} });
    expect(results.map((r) => [r.id, r.ok])).toEqual([[KOSMOS.id, true], [YAKOPOP.id, true]]);
    const y = JSON.parse(readFileSync(join(hubDir, `projects/${YAKOPOP.id}/snapshot.json`), "utf8"));
    expect(y.sources.map((s) => s.adapter)).toEqual(["usage"]);
    expect(y.collections.costs.summary).toMatchObject({ total: 4, forecast: { open: 6, done: 1 } });
    expect(y.collections.calendar["2026-10"].days.find((d) => d.d === "2026-10-18").cost).toBe(4);
    expect(y.collections.calendar["2026-10"].days.find((d) => d.d === "2026-10-10").commits).toBe(2);
    expect(existsSync(join(hubDir, `projects/${YAKOPOP.id}/local.json`))).toBe(true);

    const broken = () => { const s = kosmosSnap(); s.collections.cards["RND.L2"].status = "doing"; return s; };
    const again = await syncHub(hubDir, { adapters: { ...adapters, kosmos: broken }, only: [KOSMOS.id], log: () => {} });
    expect(again[0]).toMatchObject({ ok: false, error: expect.stringMatching(/breaks the contract/) });
    const k = JSON.parse(readFileSync(join(hubDir, `projects/${KOSMOS.id}/snapshot.json`), "utf8"));
    expect(k.collections.cards["RND.L2"].status).toBe("ready");
    expect(JSON.parse(readFileSync(join(hubDir, "hub.json"), "utf8")).projects.find((p) => p.id === KOSMOS.id).lastSync.ok).toBe(false);
  });

  it("adds a project with the adapter its checkout calls for", () => {
    const repo = mkdtempSync(join(tmpdir(), "pm-hub-repo-"));
    dirs.push(repo);
    const hub = emptyHub();
    expect(addProject(hub, { path: repo, org: "acme", repo: "site" })).toMatchObject({ id: "acme/site", adapter: "github", usage: true });
    mkdirSync(join(repo, "tools", "pm"), { recursive: true });
    writeFileSync(join(repo, "tools", "pm", "refresh.mjs"), "");
    expect(addProject(hub, { path: repo, org: "acme", repo: "engine" })).toMatchObject({ adapter: "kosmos", usage: false });
    expect(hub.orgs).toEqual([{ id: "acme", name: "acme" }]);
    expect(hub.tools.pm).toBe(join(repo, "tools", "pm"));
    expect(finalize({ collections: { cards: {}, costs: {} } }).collections.costs).toEqual({});
  });
});
