/* Run Timeline — a Canvas App that shows where the time went in an OpenHands run.
 *
 * It pairs each action with its observation into a span, lays the spans out as a
 * waterfall next to messages and errors, and reads either a live conversation
 * through host.agentServer.request() or an imported OpenHands CLI JSONL / SDK
 * event JSON file. Nothing leaves the browser except those Agent Server reads.
 *
 * The evidence rules follow the Runward project (MIT, github.com/K-kiron/runward),
 * which reads the same OpenHands formats offline: a step with no result is "open"
 * (no result was observed, not "still running"), a result without its action
 * creates no interval, and message text never decides success or failure.
 * No Runward code is included.
 *
 * Browser-only, dependency-free ESM. All styles are scoped under `.rt`. Text is
 * always set with textContent.
 */

// ─── Constants ────────────────────────────────────────────────────────────

const MAX_EVENTS = 2_000;
const MAX_IMPORT_CHARS = 32 * 1024 * 1024;
const MAX_SPANS = 5_000;
const MAX_WARNINGS = 100;
const MAX_DETAIL = 4_000;
const POLL_MS = 10_000;

// ─── Time ─────────────────────────────────────────────────────────────────

const HAS_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Parses an event timestamp. A value with an offset is the producer's own time.
 * A timezone-naive value needs a receipt time from a capture helper, or an
 * explicit `assumeUtc` (the Agent Server's own events, as the chat treats them).
 */
export function parseTime(value, observedAt, assumeUtc = false) {
  if (typeof value === "string" && value) {
    if (HAS_OFFSET.test(value)) {
      const t = Date.parse(value);
      if (!Number.isNaN(t)) return { t, basis: "producer" };
    } else {
      const seen = typeof observedAt === "string" ? Date.parse(observedAt) : Number.NaN;
      if (!Number.isNaN(seen)) return { t: seen, basis: "observed" };
      if (assumeUtc) {
        const t = Date.parse(`${value}Z`);
        if (!Number.isNaN(t)) return { t, basis: "assumed-utc" };
      }
    }
  }
  return null;
}

export function fmtDuration(ms) {
  if (ms === null || ms === undefined) return "no result";
  if (ms < 1) return "<1 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return m < 60 ? `${m} min ${s} s` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

// ─── Events ───────────────────────────────────────────────────────────────

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const clip = (text, max = MAX_DETAIL) => (text.length > max ? `${text.slice(0, max)}…` : text);

function unwrap(raw) {
  if (!isObj(raw)) return null;
  if (isObj(raw.event) && !("source" in raw)) {
    return { ...raw.event, runwardObservedAt: raw.runwardObservedAt ?? raw.event.runwardObservedAt };
  }
  return raw;
}

function contentText(content) {
  if (!Array.isArray(content)) return "";
  return content.map((p) => (isObj(p) && typeof p.text === "string" ? p.text : "")).join("\n").trim();
}

function observationText(obs) {
  if (!isObj(obs)) return "";
  const fromContent = contentText(obs.content);
  if (fromContent) return fromContent;
  for (const key of ["output", "message", "text", "command"]) if (typeof obs[key] === "string" && obs[key].trim()) return obs[key].trim();
  return "";
}

function argsText(action) {
  if (!isObj(action)) return "";
  return Object.entries(action)
    .filter(([k, v]) => k !== "kind" && v !== null && v !== undefined && v !== "")
    .slice(0, 8)
    .map(([k, v]) => `${k}: ${clip(typeof v === "string" ? v : JSON.stringify(v), 400)}`)
    .join("\n");
}

function failed(obs) {
  if (!isObj(obs)) return false;
  if (obs.is_error === true || obs.error === true) return true;
  return typeof obs.exit_code === "number" && obs.exit_code !== 0 && obs.exit_code !== -1;
}


const NOT_TICKETS = new Set(["UTF", "ISO", "SHA", "MD", "AES", "RFC", "HTTP", "CVE", "TLS", "SSL", "JSON", "PNG", "ES", "X", "TCP", "UDP", "IPV"]);

/** Ticket keys, pull requests and repositories mentioned in some text. */
export function extractRefs(text) {
  const tickets = new Set();
  const prs = new Set();
  const repos = new Set();
  if (typeof text !== "string" || !text) return { tickets: [], prs: [], repos: [] };
  for (const m of text.matchAll(/\b([A-Z][A-Z0-9]{1,9})-(\d{1,6})\b/g)) if (!NOT_TICKETS.has(m[1])) tickets.add(`${m[1]}-${m[2]}`);
  for (const m of text.matchAll(/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?\/pull\/(\d+)/g)) { prs.add(`${m[1]}#${m[2]}`); repos.add(m[1]); }
  for (const m of text.matchAll(/\bPR\s*#(\d+)/gi)) prs.add(`#${m[1]}`);
  for (const m of text.matchAll(/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git|\/|\s|$|[)"'`,.])/g)) repos.add(m[1]);
  return { tickets: [...tickets], prs: [...prs], repos: [...repos] };
}

const lineCount = (text) => (typeof text === "string" && text ? text.split("\n").length : 0);

/** Lines added and removed by a file edit action. Other actions change none. */
export function linesOf(action) {
  if (!isObj(action)) return null;
  const cmd = action.command;
  if (cmd === "create") return { added: lineCount(action.file_text), removed: 0, path: action.path ?? null };
  if (cmd === "str_replace") return { added: lineCount(action.new_str), removed: lineCount(action.old_str), path: action.path ?? null };
  if (cmd === "insert") return { added: lineCount(action.new_str), removed: 0, path: action.path ?? null };
  return null;
}

const usageOf = (value) => {
  const m = value?.stats?.usage_to_metrics ?? value?.usage_to_metrics;
  if (!isObj(m)) return null;
  const out = {};
  Object.entries(m).forEach(([id, u]) => {
    if (!isObj(u)) return;
    const tu = isObj(u.accumulated_token_usage) ? u.accumulated_token_usage : {};
    out[id] = { model: u.model_name ?? tu.model ?? null, cost: Number(u.accumulated_cost) || 0, prompt: Number(tu.prompt_tokens) || 0, completion: Number(tu.completion_tokens) || 0, cache: Number(tu.cache_read_tokens) || 0, reasoning: Number(tu.reasoning_tokens) || 0 };
  });
  return out;
};

const zeroUsage = () => ({ cost: 0, prompt: 0, completion: 0, cache: 0, reasoning: 0, models: [] });

/** What changed between two cumulative stats snapshots: one model call's cost and tokens. */
function usageDelta(now, before = {}) {
  const d = zeroUsage();
  Object.entries(now).forEach(([id, u]) => {
    const b = before[id] ?? { cost: 0, prompt: 0, completion: 0, cache: 0, reasoning: 0 };
    const grew = u.cost > b.cost || u.prompt > b.prompt || u.completion > b.completion;
    if (!grew) return;
    d.cost += Math.max(0, u.cost - b.cost);
    d.prompt += Math.max(0, u.prompt - b.prompt);
    d.completion += Math.max(0, u.completion - b.completion);
    d.cache += Math.max(0, u.cache - b.cache);
    d.reasoning += Math.max(0, u.reasoning - b.reasoning);
    if (u.model && !d.models.includes(u.model)) d.models.push(u.model);
  });
  return d;
}

const classify = (e) => {
  if (isObj(e.action) && typeof e.tool_name === "string" && e.source === "agent") return "action";
  if (isObj(e.observation) && typeof e.action_id === "string") return "observation";
  if (typeof e.rejection_reason === "string" && typeof e.action_id === "string") return "reject";
  if (e.source === "agent" && typeof e.tool_call_id === "string" && "error" in e && !e.action) return "agent-error";
  if (isObj(e.llm_message)) return "message";
  if (e.kind === "ConversationErrorEvent" || e.kind === "ServerErrorEvent") return "error";
  if (e.kind === "ConversationStateUpdateEvent" && (e.key === "stats" || e.key === "full_state")) return "stats";
  return null;
};

/**
 * Builds the timeline: paired spans plus instants (messages and errors).
 * Returns warnings for anything it could not place, and never invents an interval.
 */
export function buildTimeline(rawEvents, { assumeUtc = false } = {}) {
  const warnings = [];
  const warn = (text) => { if (warnings.length < MAX_WARNINGS) warnings.push(text); };
  const spans = new Map();
  const byCall = new Map();
  const instants = [];
  const snapshots = [];
  let skippedNaive = 0;
  let ignored = 0;

  rawEvents.forEach((raw) => {
    const e = unwrap(raw);
    const kind = e ? classify(e) : null;
    if (!e || !kind) { ignored += 1; return; }
    const time = parseTime(e.timestamp, e.runwardObservedAt, assumeUtc);
    if (!time) { skippedNaive += 1; return; }
    const id = typeof e.id === "string" ? e.id : `${kind}-${time.t}`;

    if (kind === "stats") {
      const usage = usageOf(e.value);
      if (usage && Object.keys(usage).length) snapshots.push({ t: time.t, usage });
      return;
    }
    if (kind === "action") {
      if (spans.size >= MAX_SPANS) { warn(`Only the first ${MAX_SPANS} steps are shown.`); return; }
      const span = {
        kind: "span", id, label: (typeof e.summary === "string" && e.summary.trim()) || e.tool_name, tool: e.tool_name,
        start: time.t, end: null, status: "open", args: argsText(e.action), result: "", risk: e.security_risk ?? null,
        basis: time.basis, callId: e.tool_call_id ?? null, loc: linesOf(e.action), usage: null,
      };
      spans.set(id, span);
      if (span.callId) byCall.set(span.callId, span);
    } else if (kind === "observation" || kind === "reject") {
      const span = spans.get(e.action_id);
      if (!span) { warn("A result had no matching action, so no interval was created."); return; }
      span.end = Math.max(time.t, span.start);
      span.basis = span.basis === "producer" && time.basis === "producer" ? "producer" : time.basis === "observed" || span.basis === "observed" ? "observed" : "assumed-utc";
      if (kind === "reject") {
        span.status = "rejected";
        span.result = e.rejection_reason;
      } else {
        span.status = failed(e.observation) ? "error" : "ok";
        span.result = clip(observationText(e.observation));
        if (typeof e.observation.exit_code === "number") span.exit = e.observation.exit_code;
      }
    } else if (kind === "agent-error") {
      const span = byCall.get(e.tool_call_id);
      if (span && span.end === null) {
        span.end = Math.max(time.t, span.start);
        span.status = "error";
        span.result = clip(String(e.error));
      } else {
        instants.push({ kind: "error", id, t: time.t, label: "Agent error", text: clip(String(e.error)), basis: time.basis });
      }
    } else if (kind === "message") {
      const role = e.llm_message.role === "user" ? "user" : "agent";
      const text = contentText(e.llm_message.content);
      if (text) instants.push({ kind: "message", id, t: time.t, role, label: role === "user" ? "You" : "Agent", text: clip(text), basis: time.basis, usage: null });
    } else {
      instants.push({ kind: "error", id, t: time.t, label: e.code ?? "Error", text: clip(String(e.detail ?? e.code ?? "")), basis: time.basis });
    }
  });

  if (skippedNaive) warn(`${skippedNaive} events were skipped: their timestamps have no timezone and no capture time.`);
  const list = [...spans.values()];
  snapshots.sort((a, b) => a.t - b.t);
  const deltas = snapshots.map((snap, i) => usageDelta(snap.usage, snapshots[i - 1]?.usage));
  const used = new Set();
  [...list.map((s) => ({ item: s, t: s.start })), ...instants.filter((i) => i.kind === "message" && i.role === "agent").map((i) => ({ item: i, t: i.t }))]
    .sort((a, b) => a.t - b.t)
    .forEach(({ item, t }) => {
      let j = -1;
      snapshots.forEach((snap, k) => { if (snap.t <= t + 100 && t - snap.t <= 10_000) j = k; });
      if (j < 0) return;
      if (used.has(j)) item.usage = { shared: true };
      else { used.add(j); item.usage = deltas[j]; }
    });
  const lastSnap = snapshots.at(-1);
  const usage = lastSnap ? usageDelta(lastSnap.usage) : null;
  const refs = { tickets: new Set(), prs: new Set(), repos: new Set() };
  const addRefs = (obj, text) => { obj.refs = extractRefs(text); Object.entries(obj.refs).forEach(([k, v]) => v.forEach((x) => refs[k].add(x))); };
  list.forEach((sp) => addRefs(sp, `${sp.label}\n${sp.args}\n${sp.result}`));
  instants.forEach((i) => addRefs(i, i.text));
  const lines = list.reduce((acc, sp) => ({ added: acc.added + (sp.loc?.added ?? 0), removed: acc.removed + (sp.loc?.removed ?? 0) }), { added: 0, removed: 0 });
  const all = [...list.map((s) => s.start), ...list.map((s) => s.end).filter((t) => t !== null), ...instants.map((i) => i.t)];
  return { spans: list, instants, warnings, ignored, usage, lines, refs: Object.fromEntries(Object.entries(refs).map(([k, v]) => [k, [...v]])), t0: all.length ? Math.min(...all) : null, t1: all.length ? Math.max(...all) : null };
}

/** Totals for a timeline: time inside steps (overlaps merged), time between them, and the extremes. */
export function summarize(tl) {
  if (tl.t0 === null) return null;
  const closed = tl.spans.filter((s) => s.end !== null).map((s) => [s.start, s.end]).sort((a, b) => a[0] - b[0]);
  const merged = [];
  closed.forEach(([a, b]) => {
    const last = merged.at(-1);
    if (last && a <= last[1]) last[1] = Math.max(last[1], b); else merged.push([a, b]);
  });
  const total = tl.t1 - tl.t0;
  const inSteps = merged.reduce((s, [a, b]) => s + (b - a), 0);
  let longestGap = null;
  for (let i = 1; i < merged.length; i += 1) {
    const gap = merged[i][0] - merged[i - 1][1];
    if (!longestGap || gap > longestGap.ms) longestGap = { ms: gap, at: merged[i - 1][1] - tl.t0 };
  }
  const slowest = [...tl.spans].filter((s) => s.end !== null).sort((a, b) => b.end - b.start - (a.end - a.start))[0] ?? null;
  return {
    total, inSteps, between: Math.max(0, total - inSteps), longestGap, slowest,
    lines: tl.lines, usage: tl.usage, refs: tl.refs,
    steps: tl.spans.length, open: tl.spans.filter((s) => s.end === null).length,
    errors: tl.spans.filter((s) => s.status === "error" || s.status === "rejected").length + tl.instants.filter((i) => i.kind === "error").length,
  };
}

/** Reads an exported OpenHands file: a JSON array, an object with `events`, a single event, or JSONL. */
export function parseImport(text) {
  const warnings = [];
  if (text.length > MAX_IMPORT_CHARS) return { events: [], warnings: ["The file is larger than 32 MiB and was not read."] };
  const body = text.replace(/^﻿/, "").trim();
  if (!body) return { events: [], warnings: ["The file is empty."] };
  try {
    const whole = JSON.parse(body);
    if (Array.isArray(whole)) return { events: whole, warnings };
    if (isObj(whole) && Array.isArray(whole.events)) return { events: whole.events, warnings };
    if (isObj(whole)) return { events: [whole], warnings };
  } catch { /* not one JSON value: try lines */ }
  const events = [];
  let bad = 0;
  body.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    try { events.push(JSON.parse(line)); } catch { bad += 1; }
  });
  if (bad) warnings.push(`${bad} lines were not valid JSON and were skipped.`);
  return { events, warnings };
}

// ─── Styles ───────────────────────────────────────────────────────────────

const STYLE = `
.rt { --rt-bg: var(--oh-color-base, #0B0E14); --rt-panel: var(--oh-color-base-secondary, #21252F); --rt-raised: var(--oh-surface-raised, #2C313F);
  --rt-text: var(--oh-foreground, #EEF2F7); --rt-contrast: var(--oh-contrast, #FFFFFF); --rt-muted: var(--oh-muted, #A3B0C4);
  --rt-border: var(--oh-border-subtle, #383F50); --rt-primary: var(--oh-color-primary, #C9B974);
  --rt-danger: var(--oh-danger, #E76A5E); --rt-success: var(--oh-success, #A5E75E); --rt-info: #6AA8F0; --rt-warn: #E0B050;
  color: var(--rt-text); font: 14px/1.45 system-ui, sans-serif; height: 100%; overflow: auto; padding: 24px; box-sizing: border-box; scrollbar-color: var(--rt-border) var(--rt-panel); }
.rt *, .rt *::before, .rt *::after { box-sizing: border-box; }
.rt h1 { font-size: 22px; margin: 0; font-weight: 600; color: var(--rt-contrast); }
.rt h2 { font-size: 15px; margin: 0 0 8px; font-weight: 600; color: var(--rt-contrast); }
.rt p { margin: 0; }
.rt .muted { color: var(--rt-muted); } .rt .small { font-size: 12px; } .rt .warn { color: var(--rt-danger); }
.rt .top { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.rt .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.rt .stack { display: flex; flex-direction: column; gap: 12px; }
.rt button, .rt select, .rt input { font: inherit; color: inherit; }
.rt button { background: var(--rt-raised); border: 1px solid var(--rt-border); border-radius: 8px; padding: 5px 12px; cursor: pointer; }
.rt button:hover:not(:disabled) { border-color: var(--rt-muted); }
.rt button:disabled { opacity: .5; cursor: default; }
.rt button.primary { background: var(--rt-primary); color: var(--oh-accent-foreground, #0B0E14); border-color: transparent; font-weight: 600; }
.rt button:focus-visible, .rt select:focus-visible { outline: 2px solid var(--rt-contrast); outline-offset: 1px; }
.rt select { background: var(--rt-bg); border: 1px solid var(--rt-border); border-radius: 8px; padding: 5px 8px; max-width: 360px; }
.rt label.chk { display: flex; gap: 6px; align-items: center; }
.rt .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 16px 0; }
.rt .tile, .rt .card { background: var(--rt-panel); border: 1px solid var(--rt-border); border-radius: 12px; padding: 12px 14px; }
.rt .tile b { display: block; font-size: 20px; color: var(--rt-contrast); overflow-wrap: anywhere; }
.rt .sheet { background: var(--rt-panel); border: 1px solid var(--rt-border); border-radius: 12px; overflow-x: auto; }
.rt .wf { min-width: 760px; }
.rt .wfrow { display: grid; grid-template-columns: 300px 1fr; width: 100%; border: 0; border-bottom: 1px solid var(--rt-border); border-radius: 0; background: none; padding: 0; text-align: left; align-items: stretch; }
.rt .wfrow:hover, .rt .wfrow.sel { background: var(--rt-raised); }
.rt .wfrow .lab { display: flex; gap: 8px; align-items: center; padding: 5px 10px; overflow: hidden; white-space: nowrap; border-right: 1px solid var(--rt-border); }
.rt .wfrow .lab .t { overflow: hidden; text-overflow: ellipsis; flex: 1; }
.rt .wfrow .lab .off { color: var(--rt-muted); font: 11px ui-monospace, monospace; }
.rt .track { position: relative; min-height: 28px; }
.rt .head .track, .rt .head .lab { min-height: 30px; background: var(--rt-panel); }
.rt .tick { position: absolute; top: 0; bottom: 0; border-left: 1px solid var(--rt-border); font-size: 10px; color: var(--rt-muted); padding: 2px 0 0 4px; white-space: nowrap; }
.rt .bar { position: absolute; top: 6px; height: 16px; border-radius: 3px; border: 1px solid var(--c); background: color-mix(in srgb, var(--c) 45%, transparent); min-width: 3px; }
.rt .bar.open { border-style: dashed; background: transparent; }
.rt .dot { position: absolute; top: 10px; width: 8px; height: 8px; border-radius: 50%; transform: translateX(-4px); background: var(--c); }
.rt .s-ok { --c: var(--rt-success); } .rt .s-error, .rt .s-rejected, .rt .k-error { --c: var(--rt-danger); }
.rt .s-open { --c: var(--rt-warn); } .rt .k-message { --c: var(--rt-info); }
.rt .swatch { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--c); }
.rt pre { background: var(--rt-bg); border: 1px solid var(--rt-border); border-radius: 8px; padding: 10px; overflow: auto; max-height: 260px; font-size: 12px; margin: 6px 0 0; white-space: pre-wrap; }
.rt dl { display: grid; grid-template-columns: max-content 1fr; gap: 2px 14px; margin: 0; }
.rt dt { color: var(--rt-muted); } .rt dd { margin: 0; }
.rt .tip { position: fixed; z-index: 50; max-width: 380px; background: var(--rt-panel); border: 1px solid var(--rt-muted); border-radius: 10px; padding: 10px 12px; box-shadow: 0 8px 24px rgba(0,0,0,.45); pointer-events: none; font-size: 12px; display: flex; flex-direction: column; gap: 6px; }
.rt .tip h3 { margin: 0; font-size: 13px; color: var(--rt-contrast); }
.rt .tip .sec { display: grid; grid-template-columns: max-content 1fr; gap: 1px 10px; }
.rt .tip .sec .k { color: var(--rt-muted); } .rt .tip .sec .v { word-break: break-word; }
.rt .tip .sech { color: var(--rt-muted); text-transform: uppercase; letter-spacing: .06em; font-size: 10px; margin-top: 2px; }
.rt .banner { background: var(--rt-panel); border: 1px dashed var(--rt-border); border-radius: 10px; padding: 8px 12px; }
`;

// ─── DOM helpers ──────────────────────────────────────────────────────────

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function button(label, onClick, cls = "") {
  const b = el("button", cls, label);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}
function select(options, value, onChange, label) {
  const s = el("select");
  options.forEach(([v, l]) => { const o = el("option", "", l); o.value = v; s.append(o); });
  s.value = value;
  if (label) s.setAttribute("aria-label", label);
  s.addEventListener("change", () => onChange(s.value));
  return s;
}

function normalizePage(response, label) {
  if (!isObj(response) || !Array.isArray(response.items)) throw new Error(`${label} returned an unexpected response.`);
  return { items: response.items.filter(isObj), next: typeof response.next_page_id === "string" && response.next_page_id ? response.next_page_id : null };
}


const num = (n) => Math.round(n).toLocaleString();
const money = (c) => (c > 0 ? `$${c.toFixed(c < 0.01 ? 4 : 2)}` : "not reported");
const list = (a) => (a.length ? a.join(", ") : null);

function convMeta(conv) {
  if (!isObj(conv)) return null;
  const tags = isObj(conv.tags) ? Object.entries(conv.tags).filter(([, v]) => typeof v === "string" && v).map(([k, v]) => `${k}: ${v}`) : [];
  const agent = conv.launched_agent_profile;
  const dir = isObj(conv.workspace) ? conv.workspace.working_dir ?? conv.workspace.path : typeof conv.workspace === "string" ? conv.workspace : null;
  return {
    id: conv.id, tags, workspace: dir ?? null, repo: typeof conv.selected_repository === "string" ? conv.selected_repository : null,
    agent: (isObj(agent) ? agent.name ?? agent.id : agent) ?? (isObj(conv.agent) ? conv.agent.kind : null) ?? null,
    model: conv.current_model_id ?? (isObj(conv.agent) && isObj(conv.agent.llm) ? conv.agent.llm.model : null) ?? null,
  };
}

/** Labelled sections describing one row and its run, used by the hover card and the detail panel. */
export function describeRow(item, tl, conv) {
  const isSpan = item.kind === "span";
  const sections = [];
  const step = [];
  if (isSpan) {
    step.push(["Tool", item.tool], ["Duration", fmtDuration(item.end === null ? null : item.end - item.start)], ["Status", item.status === "open" ? "open: no result observed" : item.status]);
    if (item.loc) step.push(["Lines", `+${item.loc.added} −${item.loc.removed}${item.loc.path ? ` in ${item.loc.path}` : ""}`]);
  }
  const u = item.usage;
  if (u?.shared) step.push(["Model call", "same call as an earlier step"]);
  else if (u) {
    step.push(["Model", list(u.models)], ["Tokens", `${num(u.prompt)} in · ${num(u.completion)} out${u.reasoning ? ` · ${num(u.reasoning)} reasoning` : ""}${u.cache ? ` · ${num(u.cache)} cached` : ""}`], ["Cost", money(u.cost)]);
  }
  if (step.length) sections.push(["This step", step]);
  const mine = [["Tickets", list(item.refs?.tickets ?? [])], ["Pull requests", list(item.refs?.prs ?? [])], ["Repositories", list(item.refs?.repos ?? [])]].filter(([, v]) => v);
  if (mine.length) sections.push(["Mentioned here", mine]);
  const meta = convMeta(conv);
  const total = tl.usage;
  const run = [];
  if (meta) {
    run.push(["Conversation", meta.id]);
    if (meta.repo) run.push(["Repository", meta.repo]);
    if (meta.workspace) run.push(["Workspace", meta.workspace]);
    if (meta.tags.length) run.push(["Tags", meta.tags.join(" · ")]);
    run.push(["Agent", meta.agent ?? "not reported"]);
  }
  run.push(["Models", list(total?.models ?? (meta?.model ? [meta.model] : [])) ?? "not in this log"]);
  run.push(["Lines changed", `+${tl.lines.added} −${tl.lines.removed}`]);
  run.push(["Tokens", total ? `${num(total.prompt + total.completion)} (${num(total.prompt)} in · ${num(total.completion)} out)` : "not in this log"]);
  run.push(["Cost", total ? money(total.cost) : "not in this log"]);
  [["Tickets", tl.refs.tickets], ["Pull requests", tl.refs.prs], ["Repositories", tl.refs.repos]].forEach(([k, v]) => { if (v.length) run.push([k, v.join(", ")]); });
  sections.push(["This run", run]);
  return sections;
}

// ─── Mount ────────────────────────────────────────────────────────────────

function mountTimeline(host, { container }) {
  const style = el("style");
  style.textContent = STYLE;
  document.head.append(style);
  const root = el("div", "rt");
  container.append(root);

  const ui = { convs: [], convError: null, source: null, tl: null, warnings: [], loading: false, error: null, showMessages: true, minMs: 0, pick: null };
  let disposed = false;
  let pollTimer = null;
  let loadToken = 0;

  async function loadConversations() {
    try {
      const page = normalizePage(await host.agentServer.request({ path: "/api/conversations/search?limit=100" }), "Conversation search");
      ui.convs = page.items.filter((c) => typeof c.id === "string").sort((a, b) => String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? "")));
      ui.convError = null;
    } catch (e) {
      ui.convError = e instanceof Error ? e.message : String(e);
    }
    if (!disposed) render();
  }

  async function loadLive(id, { quiet = false } = {}) {
    const token = (loadToken += 1);
    const conv = ui.convs.find((c) => c.id === id);
    if (!quiet) { ui.loading = true; ui.error = null; ui.source = { type: "live", id, title: conv?.title || id, status: conv?.execution_status ?? null, conv }; render(); }
    try {
      const events = [];
      let pageId = null;
      let pages = 0;
      do {
        const params = new URLSearchParams({ limit: "100" });
        if (pageId) params.set("page_id", pageId);
        const page = normalizePage(await host.agentServer.request({ path: `/api/conversations/${encodeURIComponent(id)}/events/search?${params}` }), "Event search");
        events.push(...page.items);
        pages += 1;
        if (page.next === pageId) break;
        pageId = page.next;
      } while (pageId && events.length < MAX_EVENTS && pages < 25);
      if (disposed || token !== loadToken) return;
      const tl = buildTimeline(events, { assumeUtc: true });
      if (events.length >= MAX_EVENTS) tl.warnings.push(`Only the first ${MAX_EVENTS} events were read.`);
      ui.tl = tl;
      ui.warnings = tl.warnings;
      ui.error = null;
    } catch (e) {
      if (token === loadToken) ui.error = e instanceof Error ? e.message : String(e);
    }
    ui.loading = false;
    if (!disposed) render();
  }

  async function importFile(file) {
    ui.loading = true; ui.error = null; render();
    try {
      const { events, warnings } = parseImport(await file.text());
      const tl = buildTimeline(events, { assumeUtc: false });
      ui.source = { type: "file", name: file.name };
      ui.tl = tl;
      ui.warnings = [...warnings, ...tl.warnings];
      ui.pick = null;
      if (tl.t0 === null) ui.error = "No timed OpenHands events were found in that file.";
    } catch (e) {
      ui.error = e instanceof Error ? e.message : String(e);
    }
    ui.loading = false;
    render();
  }

  pollTimer = window.setInterval(() => {
    const s = ui.source;
    if (s?.type === "live" && s.status === "running" && !ui.loading) {
      host.agentServer.request({ path: "/api/conversations/search?limit=100" }).then((r) => {
        const c = normalizePage(r, "Conversation search").items.find((x) => x.id === s.id);
        if (c) s.status = c.execution_status ?? s.status;
        return loadLive(s.id, { quiet: true });
      }).catch(() => {});
    }
  }, POLL_MS);

  // ── Render ──
  let tip = null;
  const showTip = (item, tl, x, y) => {
    if (!tip) { tip = el("div", "tip"); tip.setAttribute("role", "tooltip"); root.append(tip); }
    tip.replaceChildren(el("h3", "", item.kind === "span" ? item.label : `${item.label}: ${item.text.split("\n")[0].slice(0, 80)}`));
    describeRow(item, tl, ui.source?.conv).forEach(([title, rows]) => {
      tip.append(el("div", "sech", title));
      const grid = el("div", "sec");
      rows.forEach(([k, v]) => grid.append(el("span", "k", k), el("span", "v", String(v))));
      tip.append(grid);
    });
    const r = tip.getBoundingClientRect();
    tip.style.left = `${Math.max(8, Math.min(x + 16, window.innerWidth - r.width - 8))}px`;
    tip.style.top = `${Math.max(8, Math.min(y + 16, window.innerHeight - r.height - 8))}px`;
  };
  const hideTip = () => { tip?.remove(); tip = null; };

  function waterfall(tl, sum) {
    const total = Math.max(1, tl.t1 - tl.t0);
    const rows = [
      ...tl.spans.filter((s) => s.end === null || s.end - s.start >= ui.minMs).map((s) => ({ t: s.start, span: s })),
      ...tl.instants.filter((i) => i.kind === "error" || ui.showMessages).map((i) => ({ t: i.t, inst: i })),
    ].sort((a, b) => a.t - b.t);
    const pct = (t) => ((t - tl.t0) / total) * 100;
    const wrap = el("div", "wf");
    wrap.setAttribute("data-testid", "rt-waterfall");
    const head = el("div", "wfrow head");
    head.append(el("div", "lab muted small", `${rows.length} rows`));
    const axis = el("div", "track");
    [0, 25, 50, 75, 100].forEach((p) => { const tk = el("div", "tick", p === 0 ? "start" : fmtDuration((total * p) / 100)); tk.style.left = `${p === 100 ? 96 : p}%`; axis.append(tk); });
    head.append(axis);
    wrap.append(head);
    rows.forEach((r) => {
      const row = el("button", `wfrow${ui.pick === (r.span?.id ?? r.inst.id) ? " sel" : ""}`);
      row.type = "button";
      row.setAttribute("data-testid", "rt-row");
      const lab = el("div", "lab");
      const item = r.span ?? r.inst;
      const cls = r.span ? `s-${r.span.status}` : `k-${r.inst.kind}`;
      const sw = el("span", `swatch ${cls}`);
      lab.append(sw, el("span", "off", `+${fmtDuration(r.t - tl.t0)}`), el("span", "t", r.span ? r.span.label : `${r.inst.label}: ${r.inst.text.split("\n")[0]}`));
      const track = el("div", "track");
      if (r.span) {
        const s = r.span;
        const bar = el("div", `bar ${cls}${s.end === null ? " open" : ""}`);
        bar.style.left = `${pct(s.start)}%`;
        bar.style.width = s.end === null ? "1%" : `${Math.max(0.4, ((s.end - s.start) / total) * 100)}%`;
        bar.title = `${s.label}: ${s.end === null ? "no result observed" : fmtDuration(s.end - s.start)}`;
        track.append(bar);
      } else {
        const d = el("div", `dot ${cls}`);
        d.style.left = `${pct(r.inst.t)}%`;
        track.append(d);
      }
      row.append(lab, track);
      row.addEventListener("click", () => { hideTip(); ui.pick = item.id; render(); });
      row.addEventListener("mouseenter", (ev) => showTip(item, tl, ev.clientX, ev.clientY));
      row.addEventListener("mousemove", (ev) => showTip(item, tl, ev.clientX, ev.clientY));
      row.addEventListener("mouseleave", hideTip);
      row.addEventListener("focus", () => { const b = row.getBoundingClientRect(); showTip(item, tl, b.left + 40, b.top); });
      row.addEventListener("blur", hideTip);
      wrap.append(row);
    });
    return wrap;
  }

  function detail(tl) {
    const span = tl.spans.find((s) => s.id === ui.pick);
    const inst = tl.instants.find((i) => i.id === ui.pick);
    const item = span ?? inst;
    if (!item) return null;
    const card = el("div", "card stack");
    card.setAttribute("data-testid", "rt-detail");
    card.append(el("h2", "", span ? span.label : `${inst.label}`));
    const dl = el("dl");
    const add = (k, v) => { if (v !== null && v !== undefined && v !== "") dl.append(el("dt", "", k), el("dd", "", String(v))); };
    add("At", `+${fmtDuration((span ? span.start : inst.t) - tl.t0)} from the start`);
    if (span) {
      add("Tool", span.tool);
      add("Duration", fmtDuration(span.end === null ? null : span.end - span.start));
      add("Status", span.status === "open" ? "open: no result was observed" : span.status);
      add("Exit code", span.exit);
      add("Risk", span.risk && span.risk !== "UNKNOWN" ? span.risk : null);
    }
    add("Time basis", { producer: "the event's own timestamp", observed: "the capture helper's receipt time", "assumed-utc": "the Agent Server's timestamp, read as UTC" }[item.basis]);
    add("Event", item.id);
    card.append(dl);
    describeRow(item, tl, ui.source?.conv).forEach(([title, rows]) => {
      if (title === "This step") return;
      card.append(el("span", "muted small", title));
      const d2 = el("dl");
      rows.forEach(([k, v]) => d2.append(el("dt", "", k), el("dd", "", String(v))));
      card.append(d2);
    });
    if (span?.args) { card.append(el("span", "muted small", "Arguments")); card.append(el("pre", "", span.args)); }
    const body = span ? span.result : inst.text;
    if (body) { card.append(el("span", "muted small", span ? "Result" : "Text")); card.append(el("pre", "", body)); }
    return card;
  }

  function render() {
    if (disposed) return;
    tip = null;
    root.replaceChildren();
    const top = el("div", "top");
    const left = el("div");
    left.append(el("h1", "", "Run Timeline"), el("span", "muted", "Where the time went in an agent run"));
    const bar = el("div", "row");
    const opts = ui.convs.map((c) => [c.id, `${c.title || c.id}${c.execution_status ? ` (${c.execution_status})` : ""}`]);
    const pickConv = select([["", ui.convError ? "Conversations unavailable" : opts.length ? "Choose a conversation" : "No conversations"], ...opts], ui.source?.type === "live" ? ui.source.id : "", (v) => { if (v) loadLive(v); }, "Conversation");
    const refresh = button("Refresh", () => { if (ui.source?.type === "live") loadLive(ui.source.id); else loadConversations(); }, "");
    const input = el("input");
    input.type = "file";
    input.accept = ".json,.jsonl,.txt";
    input.hidden = true;
    input.addEventListener("change", () => { if (input.files?.[0]) importFile(input.files[0]); });
    bar.append(pickConv, refresh, button("Import log", () => input.click(), "primary"), input);
    top.append(left, bar);
    root.append(top);

    root.append(el("div", "banner small muted", "Intervals are between the timestamps the events carry. A step with no result is shown as open: no result was observed, which does not mean the tool is still running. Time between steps includes model and orchestration time and is not split further. Logs are not scrubbed: avoid sharing raw ones."));

    if (ui.convError) root.append(el("p", "warn small", `Could not list conversations: ${ui.convError}`));
    if (ui.error) root.append(el("p", "warn", ui.error));
    if (ui.loading) root.append(el("p", "muted", "Loading…"));

    const tl = ui.tl;
    const sum = tl ? summarize(tl) : null;
    if (!tl || !sum) {
      if (!ui.loading && !ui.error) root.append(el("p", "muted", "Choose a conversation or import an OpenHands CLI JSONL or SDK event file to see its timeline."));
      return;
    }
    const tiles = el("div", "tiles");
    [["Run length", fmtDuration(sum.total), ui.source.type === "live" ? ui.source.title : ui.source.name],
      ["Inside steps", fmtDuration(sum.inSteps), `${Math.round((sum.inSteps / Math.max(1, sum.total)) * 100)}% of the run`],
      ["Between steps", fmtDuration(sum.between), sum.longestGap ? `longest ${fmtDuration(sum.longestGap.ms)}` : ""],
      ["Steps", String(sum.steps), `${sum.open} open · ${sum.errors} errors`],
      ["Slowest step", sum.slowest ? fmtDuration(sum.slowest.end - sum.slowest.start) : "none", sum.slowest ? sum.slowest.label : ""]].forEach(([k, v, d]) => {
      const t = el("div", "tile");
      t.append(el("span", "muted small", k), el("b", "", v), el("span", "muted small", d));
      tiles.append(t);
    });
    root.append(tiles);
    const more = el("div", "tiles");
    const toks = sum.usage ? sum.usage.prompt + sum.usage.completion : null;
    [["Lines changed", `+${sum.lines.added} −${sum.lines.removed}`, "from file edits"],
      ["Tokens", toks === null ? "not in this log" : num(toks), sum.usage ? `${num(sum.usage.prompt)} in · ${num(sum.usage.completion)} out` : ""],
      ["Cost", sum.usage ? money(sum.usage.cost) : "not in this log", sum.usage ? "as reported by the server" : ""],
      ["Models", list(sum.usage?.models ?? []) ?? "not in this log", ""],
      ["References", [...sum.refs.tickets, ...sum.refs.prs].slice(0, 4).join(", ") || "none found", `${sum.refs.tickets.length} tickets · ${sum.refs.prs.length} PRs`]].forEach(([k, v, d]) => {
      const t = el("div", "tile");
      t.append(el("span", "muted small", k), el("b", "", v), el("span", "muted small", d));
      more.append(t);
    });
    root.append(more);

    const filters = el("div", "row");
    const chk = el("label", "chk");
    const cb = el("input"); cb.type = "checkbox"; cb.checked = ui.showMessages;
    cb.addEventListener("change", () => { ui.showMessages = cb.checked; render(); });
    chk.append(cb, el("span", "", "Show messages"));
    filters.append(chk, el("span", "muted small", "Hide steps shorter than"), select([["0", "Nothing"], ["100", "100 ms"], ["1000", "1 s"], ["10000", "10 s"]], String(ui.minMs), (v) => { ui.minMs = Number(v); render(); }, "Minimum step length"));
    const sheet = el("div", "sheet");
    sheet.append(waterfall(tl, sum));
    const stack = el("div", "stack");
    stack.append(filters, sheet);
    const d = detail(tl);
    if (d) {
      stack.append(d);
      if (ui.source.type === "live") stack.append(button("Open the conversation", () => host.navigate(`/conversations/${ui.source.id}`), ""));
    }
    if (ui.warnings.length) {
      const w = el("div", "card stack");
      w.append(el("h2", "", `${ui.warnings.length} warning${ui.warnings.length === 1 ? "" : "s"}`));
      ui.warnings.slice(0, 20).forEach((x) => w.append(el("span", "muted small", x)));
      stack.append(w);
    }
    root.append(stack);
  }

  render();
  loadConversations();
  return () => {
    disposed = true;
    window.clearInterval(pollTimer);
    style.remove();
    root.remove();
  };
}

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("Run Timeline requires Canvas host API 1.");
  return host.registerPage("timeline", (context) => mountTimeline(host, context));
}
