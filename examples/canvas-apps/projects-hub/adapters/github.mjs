// Adapter for any GitHub repo: issues and pull requests through `gh`, commits
// through `git log`, normalized into the snapshot contract (CONTRACT.md).
// Issues become cards `GH.<n>`; open pull requests that close no issue become
// cards `PR.<n>`. Labels set the status, tier, size and kind.
import { execFileSync } from "node:child_process";
import { makeSnapshot } from "../contract/contract.mjs";

export const NAME = "github";

// Label names (compared lower-case) -> contract status. The first status
// whose labels match wins, in this order. hub.json can replace any list.
export const DEFAULT_LABELS = {
  blocked: ["blocked", "on hold", "on-hold", "waiting", "needs info", "needs-info", "status: blocked"],
  decision: ["needs decision", "needs-decision", "decision", "question", "needs discussion"],
  verify: ["needs review", "needs-review", "in review", "in-review", "review", "status: review", "ready for review"],
  building: ["in progress", "in-progress", "wip", "doing", "status: in progress", "claimed"],
  ready: ["ready-for-dev", "ready for dev", "ready", "status: ready", "todo", "accepted", "approved"],
  backlog: ["backlog", "icebox", "later", "someday", "triage", "needs triage"],
};
const ORDER = ["blocked", "decision", "verify", "building", "ready", "backlog"];
const KIND = { bug: "fix", documentation: "doc", docs: "doc", enhancement: "feature", feature: "feature", ci: "ci", chore: "tooling", refactor: "tooling", test: "tooling", tests: "tooling" };
const SIZE = { xs: "S", s: "S", small: "S", m: "M", medium: "M", l: "L", large: "L", xl: "L" };

const pad = (n) => String(n).padStart(2, "0");
export const localDay = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const hours = (a, b) => +((Date.parse(b) - Date.parse(a)) / 36e5).toFixed(2);
const q = (arr, p) => {
  const a = arr.slice().sort((x, y) => x - y);
  return a.length ? a[Math.floor(p * (a.length - 1))] : null;
};

/** Label names -> { status, ask, tier, size, kind, rest } for one issue or PR. */
export function readLabels(names, labels = DEFAULT_LABELS) {
  const lower = names.map((n) => n.toLowerCase());
  const used = new Set();
  let status = null;
  for (const s of ORDER) {
    const hit = lower.find((n) => (labels[s] ?? []).includes(n));
    if (hit) {
      used.add(hit);
      status ??= s;
    }
  }
  let tier, size, kind;
  for (const n of lower) {
    const t = n.match(/^(?:t|tier)[ :_-]*([1-4])$/);
    if (t) { tier = Number(t[1]); used.add(n); }
    const s = n.match(/^size[ :/_-]*(xs|s|m|l|xl|small|medium|large)$/);
    if (s) { size = SIZE[s[1]]; used.add(n); }
    if (KIND[n] && !kind) { kind = KIND[n]; used.add(n); }
  }
  return { status, tier, size, kind, rest: names.filter((n) => !used.has(n.toLowerCase())) };
}

const CLOSES = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi;
const DEPENDS = /\b(?:depends on|blocked by|after|requires)\s+#(\d+)/gi;
const numbers = (text, re) => [...String(text ?? "").matchAll(re)].map((m) => Number(m[1]));

/**
 * The pure half: raw gh/git data -> contract collections.
 * @param {{ issues: object[], prs: object[], milestones: object[], commits: string[] }} raw
 *   `commits` are `git log --format=%cs|%at|%P|%s` lines.
 */
export function fromGithub(raw, project, { labels = DEFAULT_LABELS, closedLimit = 300 } = {}) {
  const prs = raw.prs ?? [];
  const closesOf = (p) => [...new Set([...(p.closingIssuesReferences ?? []).map((r) => r.number), ...numbers(p.body, CLOSES), ...numbers(p.title, CLOSES)])];
  const openPrFor = new Map();
  for (const p of prs) if (p.state === "OPEN") for (const n of closesOf(p)) openPrFor.set(n, p);

  const cards = {};
  const issues = (raw.issues ?? []).slice().sort((a, b) => b.number - a.number);
  const closed = issues.filter((i) => i.state !== "OPEN").slice(0, closedLimit);
  for (const i of [...issues.filter((x) => x.state === "OPEN"), ...closed]) {
    const L = readLabels((i.labels ?? []).map((l) => l.name ?? l), labels);
    const pr = openPrFor.get(i.number);
    let status = i.state !== "OPEN" ? "done" : L.status === "decision" ? "blocked" : L.status ?? (pr ? (pr.isDraft ? "building" : "verify") : i.assignees?.length ? "building" : "backlog");
    const card = {
      id: `GH.${i.number}`, title: i.title, status, sourceStatus: L.status ? `${i.state.toLowerCase()} · ${L.status}` : i.state.toLowerCase(),
      track: i.milestone?.title || L.rest[0] || "issues", tier: L.tier ?? 2, kind: L.kind ?? "feature", size: L.size ?? "M",
      deps: numbers(i.body, DEPENDS).map((n) => `GH.${n}`), flags: [], labels: (i.labels ?? []).map((l) => l.name ?? l), url: i.url,
    };
    if (L.status === "decision" && i.state === "OPEN") card.ask = String(i.body || i.title).replace(/\s+/g, " ").slice(0, 220);
    if (status === "blocked" && !card.ask) card.flags.push("needs_user");
    cards[card.id] = card;
  }
  for (const p of prs.filter((x) => x.state === "OPEN" && !closesOf(x).some((n) => cards[`GH.${n}`]))) {
    const L = readLabels((p.labels ?? []).map((l) => l.name ?? l), labels);
    cards[`PR.${p.number}`] = {
      id: `PR.${p.number}`, title: p.title, status: L.status === "blocked" ? "blocked" : p.isDraft ? "building" : "verify", sourceStatus: p.isDraft ? "draft pr" : "open pr",
      track: "pull requests", tier: L.tier ?? 2, kind: L.kind ?? "feature", size: L.size ?? "M", deps: [], flags: [], labels: (p.labels ?? []).map((l) => l.name ?? l), url: p.url,
    };
  }
  const cardOf = (p) => {
    const n = closesOf(p).find((x) => cards[`GH.${x}`]);
    return n ? `GH.${n}` : cards[`PR.${p.number}`] ? `PR.${p.number}` : null;
  };

  const prRows = prs.map((p) => {
    const st = p.state === "MERGED" ? "M" : p.state === "OPEN" ? "O" : "C";
    const end = p.mergedAt ?? p.closedAt ?? null, card = cardOf(p);
    return {
      n: p.number, t: String(p.title).slice(0, 110), st, status: st === "O" ? (p.isDraft ? "building" : "verify") : "done", base: p.baseRefName, br: p.headRefName,
      o: p.createdAt, e: end, h: end ? hours(p.createdAt, end) : null, add: p.additions ?? 0, del: p.deletions ?? 0, a: p.author?.login,
      card, tier: card ? cards[card].tier : null, url: p.url,
    };
  });

  const days = {};
  const day = (d) => (days[d] ??= { d, commits: 0, merges: 0, reverts: 0 });
  const cal = {};
  const cday = (d) => (cal[d] ??= { d, runs: 0, subagents: 0, calls: 0, tokens: 0, cost: 0, out: 0, hours: Array(24).fill(0), models: {}, items: [], sessions: [], landed: [], prsMerged: 0, commits: 0, events: [] });
  for (const line of raw.commits ?? []) {
    const [d, at, parents = "", ...subject] = line.split("|");
    if (!d) continue;
    const k = day(d);
    if (parents.trim().split(" ").length > 1) k.merges++;
    else k.commits++;
    if (/^Revert/.test(subject.join("|"))) k.reverts++;
    cday(localDay(Number(at) * 1000)).commits++;
  }
  for (const p of prRows) {
    const o = day(p.o.slice(0, 10));
    o.prsOpened = (o.prsOpened ?? 0) + 1;
    cday(localDay(p.o)).events.push({ ref: `#${p.n}`, status: "verify" });
    if (p.st === "M") {
      const m = day(p.e.slice(0, 10));
      m.prsMerged = (m.prsMerged ?? 0) + 1;
      const c = cday(localDay(p.e));
      c.prsMerged++;
      c.events.push({ ref: `#${p.n}`, status: "done" });
    }
  }
  for (const i of closed)
    if (i.closedAt) {
      const c = cday(localDay(i.closedAt));
      c.landed.push(`GH.${i.number}`);
      c.events.push({ ref: `GH.${i.number}`, status: "done" });
    }

  const history = {};
  for (let i = 0; i < prRows.length; i += 200) history[`prs-${pad(i / 200 + 1)}`] = { kind: "prs", items: prRows.slice(i, i + 200) };
  const dayList = Object.values(days).sort((a, b) => a.d.localeCompare(b.d));
  history.days = { kind: "days", items: dayList };
  history.issues = { kind: "issues", items: issues.map((i) => ({ n: i.number, t: i.title, st: i.state, status: cards[`GH.${i.number}`]?.status ?? (i.state === "OPEN" ? "backlog" : "done"), o: i.createdAt, e: i.closedAt })) };

  const runs = {};
  for (const p of prRows.filter((x) => x.card)) {
    const c = cards[p.card];
    runs[`pr-${p.n}`] = {
      card: p.card, status: p.status, claimed: p.o, landed: p.st === "M" ? p.e : null, claimToLandH: p.st === "M" ? p.h : null, pr: p.n,
      runtime: "github", track: c.track, tier: c.tier, size: c.size, kind: c.kind, title: c.title.slice(0, 90), sourceStatus: p.st,
    };
  }

  const calendar = {};
  for (const d of Object.values(cal)) (calendar[d.d.slice(0, 7)] ??= { month: d.d.slice(0, 7), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, days: [] }).days.push(d);
  for (const m of Object.values(calendar)) m.days.sort((a, b) => a.d.localeCompare(b.d));

  const today = new Date().toISOString().slice(0, 10);
  const rows = {};
  (raw.milestones ?? []).forEach((m, i) => {
    const total = (m.open_issues ?? 0) + (m.closed_issues ?? 0);
    const due = m.due_on ? m.due_on.slice(0, 10) : null;
    rows[`ms-${m.number}`] = {
      id: `ms-${m.number}`, group: "Milestones", title: m.title, milestone: true, start: m.created_at?.slice(0, 10) ?? null, end: due,
      status: m.state === "closed" ? "done" : due && due < today ? "stale" : "planned", progress: total ? Math.round((100 * (m.closed_issues ?? 0)) / total) : null,
      note: m.description ?? "", cards: [], order: i, updatedAt: today, updatedBy: "github-adapter",
    };
  });
  prRows.filter((p) => p.st === "O").forEach((p, i) => {
    rows[`pr-${p.n}`] = { id: `pr-${p.n}`, group: "In flight", title: `#${p.n} ${p.t}`, start: p.o.slice(0, 10), end: null, status: p.status === "building" ? "active" : "review", owner: p.a ?? "", cards: p.card ? [p.card] : [], note: p.br, order: i, updatedAt: today, updatedBy: "github-adapter" };
  });
  Object.values(cards).filter((c) => c.ask).forEach((c, i) => {
    rows[`ask-${c.id}`] = { id: `ask-${c.id}`, group: "Waiting on you", title: `${c.id} · ${c.title}`, start: null, end: null, status: "blocked", cards: [c.id], note: c.ask, order: i, updatedAt: today, updatedBy: "github-adapter" };
  });

  const merged = prRows.filter((p) => p.st === "M" && p.h != null).map((p) => p.h);
  const meta = {
    history: {
      asOf: today, prs: prRows.length, prsLinkedToCards: prRows.filter((p) => p.card).length, merged: merged.length, leadP50H: q(merged, 0.5), leadP85H: q(merged, 0.85),
      commits: dayList.reduce((s, d) => s + d.commits, 0), merges: dayList.reduce((s, d) => s + d.merges, 0), reverts: dayList.reduce((s, d) => s + d.reverts, 0), cardRuns: Object.keys(runs).length, firstDay: dayList[0]?.d ?? null,
    },
  };
  return { cards, runs, history, costs: {}, calendar, rows, meta };
}

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 256 * 1024 * 1024 }).trim();
const tryRun = (cmd, args, cwd, fallback) => {
  try {
    return run(cmd, args, cwd);
  } catch {
    return fallback;
  }
};

/** The impure half: reads the repo with gh and git. */
export function fetchGithub(project, { offline = false, limit = 1000 } = {}) {
  const cwd = project.path;
  const branch = project.branch ?? (tryRun("git", ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], cwd, "") || "HEAD");
  const commits = tryRun("git", ["log", branch, "-n", "5000", "--format=%cs|%at|%P|%s"], cwd, "").split("\n").filter(Boolean);
  if (offline) return { issues: [], prs: [], milestones: [], commits, branch };
  const repo = ["--repo", project.id];
  const gh = (args, fallback = "[]") => JSON.parse(tryRun("gh", args, cwd, fallback) || fallback);
  const issueFields = "number,title,state,labels,assignees,milestone,createdAt,closedAt,url,body";
  const prFields = "number,title,state,isDraft,createdAt,mergedAt,closedAt,headRefName,baseRefName,additions,deletions,author,url,labels,body";
  const issues = gh(["issue", "list", ...repo, "--state", "all", "--limit", String(limit), "--json", issueFields]);
  // closingIssuesReferences is newer than some gh releases; fall back to "closes #n" in the body.
  let prs = gh(["pr", "list", ...repo, "--state", "all", "--limit", String(limit), "--json", `${prFields},closingIssuesReferences`], "null");
  prs ??= gh(["pr", "list", ...repo, "--state", "all", "--limit", String(limit), "--json", prFields]);
  const milestones = gh(["api", `repos/${project.id}/milestones?state=all&per_page=100`]);
  return { issues, prs, milestones: Array.isArray(milestones) ? milestones : [], commits, branch };
}

export function collectGithub(project, options = {}) {
  const raw = fetchGithub(project, options);
  const collections = fromGithub(raw, project, options);
  const documents = Object.values(collections).reduce((s, d) => s + Object.keys(d).length, 0);
  return makeSnapshot({ ...project, branch: raw.branch.replace(/^origin\//, "") }, collections, [
    { adapter: NAME, at: new Date().toISOString(), documents, note: `${raw.issues.length} issues, ${raw.prs.length} PRs, ${raw.commits.length} commits on ${raw.branch}${options.offline ? " (offline)" : ""}` },
  ]);
}
