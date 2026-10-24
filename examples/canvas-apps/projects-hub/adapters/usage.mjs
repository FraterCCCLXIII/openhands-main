// Adapter for Claude Code usage in any repo. It reuses kosmos-engine's
// tools/pm: usage.mjs finds the repo's transcript folders by the
// ~/.claude/projects key (the main checkout's path with every non-alphanumeric
// character replaced by '-', which also covers its worktrees) and prices every
// call; calendar.mjs turns the scan into calendar months. This file only
// shapes the result into the contract's costs and calendar collections.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { makeSnapshot } from "../contract/contract.mjs";

export const NAME = "usage";
const r2 = (n) => +Number(n || 0).toFixed(2);
const q = (arr, p) => {
  const a = arr.filter((v) => v != null && Number.isFinite(v)).sort((x, y) => x - y);
  return a.length ? a[Math.floor(p * (a.length - 1))] : null;
};

/** Loads the pieces of kosmos-engine's tools/pm this adapter reuses. */
export async function loadPmTools(pmTools) {
  const imp = (f) => import(pathToFileURL(join(pmTools, f)).href);
  const [usage, lib, calendar] = await Promise.all([imp("usage.mjs"), imp("lib.mjs"), imp("calendar.mjs")]);
  const prices = JSON.parse(readFileSync(join(pmTools, "prices.json"), "utf8")).models;
  return { ...usage, priceTokens: lib.priceTokens, calendar: calendar.calendar, prices };
}

/** meta/costs (the shape tools/pm/costs.mjs writes), from a scan alone: no cards, no lease claims. */
export function costSummary(scan, prices, { priceTokens, BUCKETS, BUCKET_MID }, sourceNote) {
  const P = Object.fromEntries(prices.map((p) => [p.id, p]));
  const total = Object.values(scan.byModel).reduce((s, a) => s + a.cost, 0);
  const comp = { input: 0, w5: 0, w1h: 0, read: 0, out: 0 };
  const models = Object.entries(scan.byModel).map(([m, a]) => {
    for (const [b, t] of Object.entries(scan.ctxB[m] ?? {})) {
      if (!P[m]) continue;
      for (const k of Object.keys(comp)) comp[k] += priceTokens(P[m], { [k]: t[k] }, BUCKET_MID[b]);
    }
    return {
      model: m, calls: a.calls, input: a.input, w5: a.w5, w1h: a.w1h, read: a.read, out: a.out, think: a.think, cost: r2(a.cost), perCall: +(a.cost / a.calls).toFixed(4),
      readPerCall: Math.round(a.read / a.calls), outPerCall: Math.round(a.out / a.calls), hit: +(a.read / Math.max(1, a.read + a.w5 + a.w1h + a.input)).toFixed(4),
    };
  });
  const group = (g) => ({
    n: g.length, cost: r2(g.reduce((t, s) => t + s.cost, 0)), costP50: r2(q(g.map((s) => s.cost), 0.5) ?? 0), costP90: r2(q(g.map((s) => s.cost), 0.9) ?? 0),
    callsP50: q(g.map((s) => s.calls), 0.5), callsP90: q(g.map((s) => s.calls), 0.9), minsP50: Math.round(q(g.map((s) => s.mins), 0.5) ?? 0), ctxP50: q(g.map((s) => s.maxCtx), 0.5), ctxP90: q(g.map((s) => s.maxCtx), 0.9),
  });
  const days = Object.entries(scan.byDay).sort().map(([d, ms]) => ({ d, byModel: Object.fromEntries(Object.entries(ms).map(([m, a]) => [m, r2(a.cost)])) }));
  const writes = models.reduce((s, m) => s + m.w5 + m.w1h, 0);
  const calls = Math.max(1, scan.calls);
  return {
    asOf: new Date().toISOString().slice(0, 10), firstDay: days[0]?.d ?? null, lastDay: days.at(-1)?.d ?? null, files: scan.files, calls: scan.calls, total: r2(total),
    composition: Object.fromEntries(Object.entries(comp).map(([k, v]) => [k, r2(v)])), models,
    reprice: prices.map((p) => ({ id: p.id, name: p.name, verified: p.verified, cost: r2(Object.entries(scan.ctxAll).reduce((s, [b, t]) => s + priceTokens(p, t, BUCKET_MID[b]) * (p.tokenizer ?? 1), 0)) })),
    days,
    ctx: BUCKETS.map((b) => ({ bucket: b, calls: scan.ctxAll[b]?.calls ?? 0, cost: r2(scan.ctxAll[b]?.cost ?? 0) })),
    ctxTokens: Object.fromEntries(Object.entries(scan.ctxAll).map(([b, t]) => [b, { input: t.input, w5: t.w5, w1h: t.w1h, read: t.read, out: t.out }])),
    effort: Object.entries(scan.byEffort).map(([k, a]) => ({ model: k.split("|")[0], effort: k.split("|")[1], calls: a.calls })).sort((a, b) => b.calls - a.calls),
    parent: group(scan.streams.filter((s) => !s.sub)), sub: group(scan.streams.filter((s) => s.sub)),
    cardJoin: { sessions: 0, cards: 0, p25: null, p50: null, p75: null, p90: null, mean: null },
    profile: {
      readPerCall: Math.round(models.reduce((s, m) => s + m.read, 0) / calls), outPerCall: Math.round(models.reduce((s, m) => s + m.out, 0) / calls),
      writePerCall: Math.round(writes / calls), share1h: +(models.reduce((s, m) => s + m.w1h, 0) / Math.max(1, writes)).toFixed(3),
    },
    source: `Claude Code transcripts ${sourceNote}, deduplicated by message id; list prices from kosmos-engine tools/pm/prices.json, not billing`,
  };
}

/** Calendar months from tools/pm/calendar.mjs, which writes through a Writer's put(). */
export function calendarMonths(calendar, root, scan) {
  const months = {};
  calendar({ put: (collection, id, data) => (months[id] = data) }, { root, scan, prs: [] });
  return months;
}

/**
 * @param {object} project hub.json project
 * @param {{ pmTools: string, transcripts?: string, tools?: object }} options
 *   `pmTools`: a kosmos-engine checkout's tools/pm folder; `tools` replaces
 *   what loadPmTools reads (tests).
 */
export async function collectUsage(project, { pmTools, transcripts, tools } = {}) {
  const t = tools ?? (await loadPmTools(pmTools));
  const dirs = transcripts ? [transcripts] : t.transcriptDirs(project.path);
  const scan = await t.scanTranscripts({ root: project.path, dirs, prices: t.prices });
  const collections = { costs: {}, calendar: {}, prices: {} };
  if (scan.calls) {
    collections.costs.summary = costSummary(scan, t.prices, t, `in ${dirs.length} ~/.claude/projects folder${dirs.length === 1 ? "" : "s"} for ${project.repo}`);
    for (const [m, d] of Object.entries(calendarMonths(t.calendar, project.path, scan)))
      collections.calendar[m] = { ...d, days: d.days.map(({ landed, ...x }) => ({ ...x, landed: [], prsMerged: 0, commits: 0 })) };
  }
  t.prices.forEach((p, i) => (collections.prices[p.id] = { ...p, order: i }));
  return makeSnapshot(project, collections, [{ adapter: NAME, at: new Date().toISOString(), documents: scan.calls, note: `${scan.calls} calls in ${dirs.length} transcript folders` }]);
}
