// Small, hand-written inputs for the adapter, rollup and store tests.

export const KOSMOS = { id: "Modern-Telepathy/kosmos-engine", org: "Modern-Telepathy", repo: "kosmos-engine", name: "kosmos-engine", path: "/repos/kosmos-engine", url: "https://github.com/Modern-Telepathy/kosmos-engine", adapter: "kosmos" };
export const YAKOPOP = { id: "Modern-Telepathy/yakopop", org: "Modern-Telepathy", repo: "yakopop", name: "yakopop", path: "/repos/yakopop", url: "https://github.com/Modern-Telepathy/yakopop", adapter: "github" };
export const OPENHANDS = { id: "FraterCCCLXIII/openhands-main", org: "FraterCCCLXIII", repo: "openhands-main", name: "OpenHands", path: "/repos/OpenHands", url: "https://github.com/FraterCCCLXIII/openhands-main", adapter: "github" };

const day = (d, x) => ({ d, runs: 1, subagents: 0, calls: 10, tokens: 1000, cost: 1.5, out: 100, hours: Array(24).fill(0).map((_, i) => (i === 9 ? 10 : 0)), models: { opus: { calls: 10, cost: 1.5, tokens: 1000 } }, items: [{ item: "rnd-l2", calls: 10, cost: 1.5 }], sessions: [{ id: "aaaa1111", calls: 10, cost: 1.5, model: "opus", item: "rnd-l2" }], landed: [], prsMerged: 0, commits: 2, ...x });

/** What tools/pm/refresh.mjs writes, trimmed to the fields the adapter reads. */
export const kosmosRefresh = () => ({
  registry: {
    "chunk-1": {
      asOf: "2026-10-20",
      cards: [
        { id: "RND.L1", t: "Done card", s: "done", tier: 3, kind: "feature", size: "M", track: "render", deps: [], f: [], r: 0 },
        { id: "RND.L2", t: "One colour path", s: "todo", tier: 3, kind: "feature", size: "L", track: "render", deps: ["RND.L1"], f: ["crit"], r: 1 },
        { id: "AGT.R3", t: "Proof ladder", s: "claimed", tier: 3, kind: "feature", size: "M", track: "agents", deps: [], f: [], r: 0 },
        { id: "ORC.PM5", t: "Review the hub", s: "in-pr", tier: 2, kind: "tooling", size: "S", track: "agents", deps: [], f: [], r: 0 },
        { id: "PLT.go", t: "Go or no-go", s: "todo", tier: 4, kind: "design", size: "S", track: "platform", deps: [], f: [], r: 0, ask: "Tick go?" },
        { id: "VOX.9", t: "Later voxels", s: "todo", tier: 2, kind: "feature", size: "M", track: "voxels", deps: ["RND.L2"], f: [], r: 0 },
      ],
    },
  },
  runs: { "rnd-l1": { card: "RND.L1", claimed: "2026-10-18T10:00:00Z", landed: "2026-10-18T14:00:00Z", claimToLandH: 4, status: "pass" }, "agt-r3": { card: "AGT.R3", claimed: "2026-10-20T10:00:00Z" } },
  history: {
    "prs-01": { kind: "prs", items: [{ n: 10, t: "RND.L1 done", st: "M", base: "proto", br: "task/rnd-l1", o: "2026-10-18T10:00:00Z", e: "2026-10-18T14:00:00Z", h: 4, add: 10, del: 2, card: "RND.L1", tier: 3 }, { n: 11, t: "ORC.PM5", st: "O", base: "proto", br: "task/orc-pm5", o: "2026-10-20T10:00:00Z", e: null, h: null, add: 5, del: 0, card: "ORC.PM5", tier: 2 }] },
    days: { kind: "days", items: [{ d: "2026-10-18", commits: 3, merges: 1, reverts: 0, prsOpened: 1, prsMerged: 1 }] },
    issues: { kind: "issues", items: [{ n: 1, t: "An issue", st: "CLOSED", o: "2026-10-01T00:00:00Z", e: "2026-10-02T00:00:00Z" }] },
  },
  meta: {
    board: { proto: "df084f7e", asOf: "2026-10-20", cards: 6, done: 1, ready: 1 },
    costs: { asOf: "2026-10-20", total: 100, calls: 200, files: 3, firstDay: "2026-10-18", lastDay: "2026-10-20", composition: { read: 60, w5: 20, w1h: 5, out: 10, input: 5 }, models: [{ model: "claude-opus-5-5", calls: 200, input: 10, w5: 10, w1h: 0, read: 1000, out: 100, think: 10, cost: 100 }], reprice: [{ id: "claude-opus-5-5", cost: 100 }], days: [{ d: "2026-10-18", byModel: { "claude-opus-5-5": 40 } }, { d: "2026-10-20", byModel: { "claude-opus-5-5": 60 } }], ctx: [{ bucket: "<50k", calls: 200, cost: 100 }], ctxTokens: { "<50k": { input: 10, w5: 10, w1h: 0, read: 1000, out: 100 } }, effort: [{ model: "claude-opus-5-5", effort: "high", calls: 200 }], parent: { n: 4, cost: 90 }, sub: { n: 2, cost: 10 }, cardJoin: { sessions: 1, cards: 1, p50: 20, mean: 20 }, forecast: { open: 5, done: 1, allInPerCard: 100, byTier: [{ tier: 1, open: 0 }, { tier: 2, open: 2 }, { tier: 3, open: 2 }, { tier: 4, open: 1 }] }, profile: { readPerCall: 5, outPerCall: 1, writePerCall: 1, share1h: 0 }, source: "kosmos transcripts" },
    history: { asOf: "2026-10-20", prs: 2, merged: 1 },
  },
  cardstats: { "chunk-1": { cards: [{ id: "RND.L1", s: "done", m: { cost: 12.5 } }, { id: "AGT.R3", s: "claimed", m: { cost: 3 } }] } },
  cardcost: { aaaa1111: { id: "aaaa1111", cards: ["RND.L1"], cost: 12.5, perCard: 12.5 } },
  calendar: { "2026-10": { month: "2026-10", tz: "Europe/Paris", days: [day("2026-10-18", { landed: ["RND.L1"] }), day("2026-10-20")] } },
  rows: { "row-a": { id: "row-a", group: "Waiting on you", title: "PLT.go · Go or no-go", cards: ["PLT.go"], note: "Tick go?" } },
  lanes: { render: { id: "render", name: "Render core", kind: "serial", match: "^RND\\.", held: ["RND.L2"], next: [] } },
  actions: { "auto-push": { id: "auto-push", title: "Push proto", done: false } },
  prices: { "claude-opus-5-5": { id: "claude-opus-5-5", name: "Claude Opus 5.5", input: 4, output: 20, cacheRead: 0.2, write5m: 5, write1h: 8, order: 0 } },
});

/** What fetchGithub returns, as gh and git print it. */
export const githubRaw = () => ({
  issues: [
    { number: 1, title: "Crash on load", state: "OPEN", labels: [{ name: "bug" }, { name: "ready-for-dev" }, { name: "size: s" }], assignees: [], milestone: { title: "Beta" }, createdAt: "2026-10-01T00:00:00Z", closedAt: null, url: "https://github.com/Modern-Telepathy/yakopop/issues/1", body: "Depends on #3" },
    { number: 2, title: "Pick an engine", state: "OPEN", labels: [{ name: "needs decision" }], assignees: [], milestone: null, createdAt: "2026-10-02T00:00:00Z", closedAt: null, url: "https://github.com/Modern-Telepathy/yakopop/issues/2", body: "Godot or our own?" },
    { number: 3, title: "Old work", state: "CLOSED", labels: [], assignees: [], milestone: { title: "Beta" }, createdAt: "2026-10-03T00:00:00Z", closedAt: "2026-10-10T12:00:00Z", url: "https://github.com/Modern-Telepathy/yakopop/issues/3", body: "" },
    { number: 4, title: "Being built", state: "OPEN", labels: [{ name: "T3" }], assignees: [{ login: "a" }], milestone: null, createdAt: "2026-10-04T00:00:00Z", closedAt: null, url: "u4", body: "" },
    { number: 5, title: "Has a PR", state: "OPEN", labels: [], assignees: [], milestone: null, createdAt: "2026-10-05T00:00:00Z", closedAt: null, url: "u5", body: "" },
    { number: 6, title: "Blocked thing", state: "OPEN", labels: [{ name: "Blocked" }], assignees: [], milestone: null, createdAt: "2026-10-06T00:00:00Z", closedAt: null, url: "u6", body: "" },
  ],
  prs: [
    { number: 20, title: "Fix the old work", state: "MERGED", isDraft: false, createdAt: "2026-10-09T00:00:00Z", mergedAt: "2026-10-10T12:00:00Z", closedAt: "2026-10-10T12:00:00Z", headRefName: "fix/old", baseRefName: "main", additions: 30, deletions: 3, author: { login: "a" }, url: "https://github.com/Modern-Telepathy/yakopop/pull/20", labels: [], body: "Closes #3", closingIssuesReferences: [{ number: 3 }] },
    { number: 21, title: "Work on #5", state: "OPEN", isDraft: false, createdAt: "2026-10-11T00:00:00Z", mergedAt: null, closedAt: null, headRefName: "feat/five", baseRefName: "main", additions: 5, deletions: 1, author: { login: "b" }, url: "https://github.com/Modern-Telepathy/yakopop/pull/21", labels: [], body: "fixes #5" },
    { number: 22, title: "Standalone tweak", state: "OPEN", isDraft: true, createdAt: "2026-10-12T00:00:00Z", mergedAt: null, closedAt: null, headRefName: "tweak", baseRefName: "main", additions: 1, deletions: 1, author: { login: "b" }, url: "https://github.com/Modern-Telepathy/yakopop/pull/22", labels: [], body: "" },
  ],
  milestones: [{ number: 1, title: "Beta", state: "open", open_issues: 1, closed_issues: 1, due_on: "2099-01-01T00:00:00Z", created_at: "2026-10-01T00:00:00Z", description: "" }],
  commits: ["2026-10-10|1791633600|abc|Merge pull request #20", "2026-10-10|1791633700|abc def|Merge branch", "2026-10-11|1791720000|abc|Revert \"x\""],
  branch: "origin/main",
});

export function memoryStorage(files = {}) {
  return {
    files,
    reads: 0,
    read: async function (file) {
      this.reads++;
      return files[file] ?? null;
    },
    write: async (file, text) => {
      files[file] = text;
    },
  };
}
