// Turns per-project snapshots (CONTRACT.md) into the collections page.html
// reads, for one scope: every project, one organization, or one project.
//
// One project in scope: its documents keep their own ids. Several: every card
// reference gets the project's key as a prefix (`kosmos-engine:RND.L2`), every
// document id too (`kosmos-engine_RND.L2`),
// tracks become `<key>/<track>`, and documents that summarize a project
// (meta/board, meta/costs, meta/history, calendar months, history days) are
// summed. Runs in the browser (bundled by build.mjs) and in Node (tests,
// hub-sync.mjs).

export const ALL = "all";

// Contract status -> the page registry's `s` and `r` fields, which page.html
// turns back into the same six board columns.
const PAGE_STATUS = {
  backlog: "todo",
  ready: "todo",
  building: "claimed",
  verify: "in-pr",
  blocked: "blocked",
  done: "done",
};
const CHUNK = 170;
const r2 = (n) => +Number(n || 0).toFixed(2);
const sum = (list, f) => list.reduce((s, x) => s + (Number(f(x)) || 0), 0);
const q = (arr, p) => {
  const a = arr.filter((v) => v != null && Number.isFinite(v)).sort((x, y) => x - y);
  return a.length ? a[Math.floor(p * (a.length - 1))] : null;
};

/** Short, unique names for projects: the repo, or `org.repo` where repos share a name. */
export function projectKeys(projects) {
  const count = {};
  for (const p of projects) count[p.repo] = (count[p.repo] ?? 0) + 1;
  return new Map(projects.map((p) => [p.id, count[p.repo] > 1 ? `${p.org}.${p.repo}` : p.repo]));
}

export function inScope(project, scope) {
  if (!scope || scope === ALL) return true;
  if (scope.startsWith("org:")) return project.org === scope.slice(4);
  return project.id === scope;
}

export function scopeLabel(scope, projects) {
  if (!scope || scope === ALL) return `All projects (${projects.length})`;
  if (scope.startsWith("org:")) return scope.slice(4);
  return projects.find((p) => p.id === scope)?.name ?? scope;
}

/** A project's collections as page.html reads them, ids unprefixed. */
export function pageCollections({ project, collections: c }) {
  const out = {};
  for (const [name, docs] of Object.entries(c))
    if (!["cards", "costs", "meta"].includes(name)) out[name] = { ...docs };
  const cards = Object.values(c.cards ?? {});
  const slim = cards.map((x) => ({
    id: x.id, t: x.title, s: PAGE_STATUS[x.status] ?? "todo", r: x.status === "ready" ? 1 : 0,
    tier: x.tier ?? 2, kind: x.kind ?? "feature", size: x.size ?? "M", track: x.track || "default",
    deps: x.deps ?? [], f: x.flags ?? [], ask: x.ask, gate: x.gate, plan: x.plan, url: x.url, project: project.id,
  }));
  const asOf = (c.meta?.board?.asOf ?? new Date().toISOString()).slice(0, 10);
  out.registry = {};
  for (let i = 0; i * CHUNK < slim.length; i++)
    out.registry[`chunk-${i + 1}`] = { asOf, cards: slim.slice(i * CHUNK, (i + 1) * CHUNK), project: project.id };
  out.meta = { ...c.meta };
  out.meta.board ??= {
    proto: project.branch ?? "main", asOf, cards: cards.length, project: project.id,
    done: cards.filter((x) => x.status === "done").length, ready: cards.filter((x) => x.status === "ready").length,
  };
  if (c.costs?.summary) out.meta.costs = c.costs.summary;
  out.cardcost = {};
  for (const [id, d] of Object.entries(c.costs ?? {}))
    if (id.startsWith("session-")) out.cardcost[id.slice(8)] = d;
  out.history = Object.fromEntries(Object.entries(out.history ?? {}).map(([id, d]) => [id, d.kind === "prs" && project.url
    ? { ...d, items: d.items.map((p) => (p.url ? p : { ...p, url: `${project.url}/pull/${p.n}` })) } : d]));
  out.meta.history ??= historyMeta(out.history, Object.keys(out.runs ?? {}).length, asOf);
  return out;
}

function historyMeta(history, runs, asOf) {
  const prs = Object.values(history).filter((d) => d.kind === "prs").flatMap((d) => d.items);
  const days = (Object.values(history).find((d) => d.kind === "days")?.items ?? []).slice().sort((a, b) => a.d.localeCompare(b.d));
  const merged = prs.filter((p) => p.st === "M" && p.h != null).map((p) => p.h);
  return {
    asOf, prs: prs.length, prsLinkedToCards: prs.filter((p) => p.card).length, merged: merged.length,
    leadP50H: q(merged, 0.5), leadP85H: q(merged, 0.85), commits: sum(days, (d) => d.commits),
    merges: sum(days, (d) => d.merges), reverts: sum(days, (d) => d.reverts), cardRuns: runs, firstDay: days[0]?.d ?? null,
  };
}

/** Sums calendar months (same month, several projects or adapters) day by day. */
export function mergeMonths(months) {
  const days = {};
  for (const m of months) for (const d of m.days ?? []) (days[d.d] ??= []).push(d);
  const top = (list, n, key) => {
    const by = {};
    for (const x of list) {
      const k = x[key];
      const a = (by[k] ??= { ...x, calls: 0, cost: 0 });
      a.calls += x.calls ?? 0;
      a.cost += x.cost ?? 0;
    }
    return Object.values(by).sort((a, b) => b.cost - a.cost).slice(0, n).map((x) => ({ ...x, cost: r2(x.cost) }));
  };
  const merged = Object.values(days).map((list) => {
    const models = {};
    for (const d of list)
      for (const [f, v] of Object.entries(d.models ?? {})) {
        const m = (models[f] ??= { calls: 0, cost: 0, tokens: 0 });
        m.calls += v.calls ?? 0; m.cost = r2(m.cost + (v.cost ?? 0)); m.tokens += v.tokens ?? 0;
      }
    const hrs = Array(24).fill(0);
    for (const d of list) (d.hours ?? []).forEach((v, i) => (hrs[i] += v));
    const out = { d: list[0].d, hours: hrs, models };
    for (const k of ["runs", "subagents", "calls", "tokens", "out", "prsMerged", "commits"]) out[k] = sum(list, (d) => d[k]);
    out.cost = r2(sum(list, (d) => d.cost));
    out.items = top(list.flatMap((d) => d.items ?? []), 5, "item");
    out.sessions = top(list.flatMap((d) => d.sessions ?? []), 6, "id");
    out.landed = [...new Set(list.flatMap((d) => d.landed ?? []))];
    out.events = list.flatMap((d) => d.events ?? []);
    return out;
  });
  const first = months[0] ?? {};
  return { ...first, days: merged.sort((a, b) => a.d.localeCompare(b.d)) };
}

/** Sums meta/costs documents (tools/pm/costs.mjs shape) across projects. */
export function mergeCosts(list) {
  if (list.length <= 1) return list[0];
  const total = sum(list, (c) => c.total), calls = sum(list, (c) => c.calls);
  const byKey = (rows, key, fields) => {
    const by = new Map();
    for (const r of rows) {
      const a = by.get(r[key]);
      if (!a) by.set(r[key], { ...r });
      else for (const f of fields) a[f] = (a[f] ?? 0) + (r[f] ?? 0);
    }
    return [...by.values()];
  };
  const models = byKey(list.flatMap((c) => c.models ?? []), "model", ["calls", "input", "w5", "w1h", "read", "out", "think", "cost"]).map((m) => ({
    ...m, cost: r2(m.cost), perCall: +(m.cost / Math.max(1, m.calls)).toFixed(4), readPerCall: Math.round(m.read / Math.max(1, m.calls)),
    outPerCall: Math.round(m.out / Math.max(1, m.calls)), hit: +(m.read / Math.max(1, m.read + m.w5 + m.w1h + m.input)).toFixed(4),
  }));
  const days = {};
  for (const c of list) for (const d of c.days ?? []) {
    const x = (days[d.d] ??= { d: d.d, byModel: {} });
    for (const [m, v] of Object.entries(d.byModel)) x.byModel[m] = r2((x.byModel[m] ?? 0) + v);
  }
  const weighted = (get, w) => {
    const ws = sum(list, w);
    return ws ? sum(list, (c) => (get(c) ?? 0) * w(c)) / ws : null;
  };
  const group = (k) => {
    const g = list.map((c) => c[k]).filter(Boolean), n = sum(g, (x) => x.n);
    const avg = (f) => (n ? Math.round(sum(g, (x) => (x[f] ?? 0) * x.n) / n) : null);
    return { n, cost: r2(sum(g, (x) => x.cost)), costP50: avg("costP50"), costP90: avg("costP90"), callsP50: avg("callsP50"), callsP90: avg("callsP90"), minsP50: avg("minsP50"), ctxP50: avg("ctxP50"), ctxP90: avg("ctxP90") };
  };
  const cj = list.map((c) => c.cardJoin).filter(Boolean), cjN = sum(cj, (x) => x.cards);
  const cjAvg = (f) => (cjN ? r2(sum(cj, (x) => (x[f] ?? 0) * x.cards) / cjN) : null);
  const fc = list.map((c) => c.forecast).filter(Boolean), done = sum(fc, (f) => f.done);
  const sumObj = (objs) => {
    const out = {};
    for (const o of objs) for (const [k, v] of Object.entries(o ?? {})) out[k] = typeof v === "number" ? r2((out[k] ?? 0) + v) : out[k] ?? v;
    return out;
  };
  return {
    asOf: list.map((c) => c.asOf).sort().at(-1), firstDay: list.map((c) => c.firstDay).filter(Boolean).sort()[0] ?? null,
    lastDay: list.map((c) => c.lastDay).filter(Boolean).sort().at(-1) ?? null, files: sum(list, (c) => c.files), calls, total: r2(total),
    composition: sumObj(list.map((c) => c.composition)), models,
    reprice: byKey(list.flatMap((c) => c.reprice ?? []), "id", ["cost"]).map((r) => ({ ...r, cost: r2(r.cost) })),
    days: Object.values(days).sort((a, b) => a.d.localeCompare(b.d)),
    ctx: byKey(list.flatMap((c) => c.ctx ?? []), "bucket", ["calls", "cost"]).map((b) => ({ ...b, cost: r2(b.cost) })),
    ctxTokens: Object.fromEntries(Object.entries(list.reduce((acc, c) => { for (const [b, t] of Object.entries(c.ctxTokens ?? {})) acc[b] = sumObj([acc[b], t]); return acc; }, {}))),
    effort: byKey(list.flatMap((c) => (c.effort ?? []).map((e) => ({ ...e, k: `${e.model}|${e.effort}` }))), "k", ["calls"]).map(({ k, ...e }) => e).sort((a, b) => b.calls - a.calls),
    parent: group("parent"), sub: group("sub"),
    cardJoin: { sessions: sum(cj, (x) => x.sessions), cards: cjN, p25: cjAvg("p25"), p50: cjAvg("p50"), p75: cjAvg("p75"), p90: cjAvg("p90"), mean: cjAvg("mean") },
    forecast: { open: sum(fc, (f) => f.open), done, allInPerCard: r2(total / Math.max(1, done)), byTier: [1, 2, 3, 4].map((t) => ({ tier: t, open: sum(fc, (f) => f.byTier?.find((b) => b.tier === t)?.open) })) },
    profile: {
      readPerCall: Math.round(weighted((c) => c.profile?.readPerCall, (c) => c.calls) ?? 0), outPerCall: Math.round(weighted((c) => c.profile?.outPerCall, (c) => c.calls) ?? 0),
      writePerCall: Math.round(weighted((c) => c.profile?.writePerCall, (c) => c.calls) ?? 0), share1h: +(weighted((c) => c.profile?.share1h, (c) => c.calls) ?? 0).toFixed(3),
    },
    byStatus: sumObj(list.map((c) => c.byStatus)),
    source: `${list.length} projects. ${[...new Set(list.map((c) => c.source).filter(Boolean))].join(" ")}`,
  };
}

// Card references in each page collection, so several projects can share one board.
const refs = (key) => {
  const p = (v) => (typeof v === "string" && v ? `${key}:${v}` : v);
  const t = (v) => (v ? `${key}/${v}` : key);
  const label = (v) => `${key} · ${v ?? ""}`;
  return {
    registry: (d) => ({ ...d, cards: d.cards.map((c) => ({ ...c, id: p(c.id), deps: (c.deps ?? []).map(p), track: t(c.track) })) }),
    rows: (d) => ({ ...d, id: p(d.id), cards: (d.cards ?? []).map(p), title: label(d.title) }),
    runs: (d) => ({ ...d, card: p(d.card), track: t(d.track) }),
    cardstate: (d) => ({ ...d, card: p(d.card) }),
    decisions: (d) => ({ ...d, card: p(d.card) }),
    inbox: (d) => ({
      ...d, selected: p(d.selected),
      route: d.route && { ...d.route, card: p(d.route.card), track: d.route.track && t(d.route.track), actions: (d.route.actions ?? []).map((a) => (typeof a.card === "string" ? { ...a, card: p(a.card) } : a)), alternatives: (d.route.alternatives ?? []).map((a) => ({ ...a, card: p(a.card) })) },
    }),
    proposals: (d) => ({ ...d, id: p(d.id), deps: (d.deps ?? []).map(p), track: t(d.track) }),
    cardstats: (d) => ({ ...d, cards: (d.cards ?? []).map((c) => ({ ...c, id: p(c.id) })) }),
    cardcost: (d) => ({ ...d, id: p(d.id), cards: (d.cards ?? []).map(p) }),
    jobs: (d) => ({ ...d, id: p(d.id), card: p(d.card), lane: p(d.lane) }),
    lanes: (d) => ({ ...d, id: p(d.id), name: label(d.name), held: (d.held ?? []).map(p), next: (d.next ?? []).map(p) }),
    actions: (d) => ({ ...d, id: p(d.id), title: label(d.title) }),
    sessions: (d) => ({ ...d, id: p(d.id), parent: p(d.parent) }),
    month: (d) => ({ ...d, days: (d.days ?? []).map((x) => ({ ...x, landed: (x.landed ?? []).map(p), items: (x.items ?? []).map((i) => ({ ...i, item: p(i.item) })), sessions: (x.sessions ?? []).map((s) => ({ ...s, item: p(s.item) })) })) }),
    prs: (items) => items.map((x) => ({ ...x, card: p(x.card), track: x.track && t(x.track) })),
  };
};

/** Undoes refs() for a document the page writes: strips `<key>:`, `<key>/` and `<key> · `. */
export function stripRefs(data, key) {
  const heads = [`${key}:`, `${key}/`, `${key} · `];
  const walk = (v) => {
    if (typeof v === "string") {
      const h = heads.find((x) => v.startsWith(x));
      return h ? v.slice(h.length) : v;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(data);
}

/**
 * @param {{ project: object, collections: object }[]} entries every project,
 *   with its local overlay already laid over its snapshot
 * @param {string} scope ALL, `org:<org>`, or a project id
 * @returns {{ collections: object, projects: object[], keys: Map<string, string> }}
 */
export function rollup(entries, scope = ALL) {
  const keys = projectKeys(entries.map((e) => e.project));
  const chosen = entries.filter((e) => inScope(e.project, scope));
  const projects = chosen.map((e) => e.project);
  if (chosen.length === 1) return { collections: pageCollections(chosen[0]), projects, keys };

  const out = { meta: {}, calendar: {}, history: {}, prices: {} };
  const costs = [], months = {}, prs = [], days = {}, issues = [], boards = [];
  for (const e of chosen) {
    const key = keys.get(e.project.id), R = refs(key);
    const pc = pageCollections(e);
    for (const [name, docs] of Object.entries(pc)) {
      if (name === "meta") {
        if (docs.costs) costs.push(docs.costs);
        boards.push(docs.board);
        if (docs.capacity && !out.meta.capacity) out.meta.capacity = docs.capacity;
        if (docs.estimates) (out.meta._estimates ??= []).push(docs.estimates);
        continue;
      }
      if (name === "calendar") {
        for (const [m, d] of Object.entries(docs)) (months[m] ??= []).push(R.month(d));
        continue;
      }
      if (name === "history") {
        for (const d of Object.values(docs)) {
          if (d.kind === "prs") prs.push(...R.prs(d.items).map((x) => ({ ...x, project: e.project.id })));
          if (d.kind === "issues") issues.push(...d.items.map((x) => ({ ...x, project: e.project.id })));
          if (d.kind === "days") for (const x of d.items) {
            const a = (days[x.d] ??= { d: x.d });
            for (const [k, v] of Object.entries(x)) if (typeof v === "number") a[k] = (a[k] ?? 0) + v;
          }
        }
        continue;
      }
      if (name === "prices") {
        for (const [id, d] of Object.entries(docs)) out.prices[id] ??= d;
        continue;
      }
      const map = R[name] ?? ((d) => d);
      out[name] ??= {};
      // `_`, not `:`, because page.html turns a card id into a doc id that way.
      for (const [id, d] of Object.entries(docs)) out[name][`${key}_${id}`] = map(d);
    }
  }
  const asOf = boards.map((b) => b.asOf).sort().at(-1);
  out.meta.board = { proto: `${chosen.length} projects`, asOf, cards: sum(boards, (b) => b.cards), done: sum(boards, (b) => b.done), ready: sum(boards, (b) => b.ready) };
  if (costs.length) out.meta.costs = mergeCosts(costs);
  if (out.meta._estimates?.length === 1) out.meta.estimates = out.meta._estimates[0];
  delete out.meta._estimates;
  for (const [m, list] of Object.entries(months)) out.calendar[m] = mergeMonths(list);
  prs.sort((a, b) => String(a.o).localeCompare(String(b.o)));
  for (let i = 0; i < prs.length; i += 200) out.history[`prs-${String(i / 200 + 1).padStart(2, "0")}`] = { kind: "prs", items: prs.slice(i, i + 200) };
  out.history.days = { kind: "days", items: Object.values(days).sort((a, b) => a.d.localeCompare(b.d)) };
  out.history.issues = { kind: "issues", items: issues };
  out.meta.history = historyMeta(out.history, Object.keys(out.runs ?? {}).length, asOf);
  return { collections: out, projects, keys };
}
