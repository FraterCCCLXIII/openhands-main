// Summarizes every local OpenHands conversation into one JSON file the Runner
// "Fleet" view reads through the Agent Server's file API.
//
//   node scan-conversations.mjs [--root ~/.openhands/agent-canvas] [--out ~/.openhands/run-timeline/summary.json]
//
// It reads only each conversation's events/ folder and a short allow-list of meta.json
// fields. It never opens base_state.json, the key files beside the conversations, or the
// secrets fields of meta.json, and the summary holds counts, names and times, not message text.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const expand = (p) => resolve(p.replace(/^~(?=$|\/)/, homedir()));
const root = expand(arg("--root", "~/.openhands/agent-canvas"));
const out = expand(arg("--out", "~/.openhands/run-timeline/summary.json"));
const FOLDERS = ["conversations", "dev_conversations"];

const RESERVED = new Set(["acpserver", "clientsource", "automationtrigger", "automationid", "automationname", "automationrunid", "automationdraftid", "automationmaterializeddraftid", "automationeditid", "title", "git_provider", "repo_name", "repo", "repository", "selected_branch", "branch", "archiveworkspacepath", "workspace", "working_dir", "localplannerparent"]);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const readJson = (file) => { try { return JSON.parse(readFileSync(file, "utf8")); } catch { return null; } };
const name = (v) => (typeof v === "string" ? v : isObj(v) ? v.name ?? v.id ?? v.kind ?? null : null);

function meta(dir) {
  const m = readJson(join(dir, "meta.json"));
  if (!isObj(m)) return {};
  const tags = isObj(m.tags) ? Object.fromEntries(Object.entries(m.tags).filter(([k, v]) => !RESERVED.has(k.trim().toLowerCase()) && typeof v === "string")) : {};
  return {
    title: typeof m.title === "string" ? m.title : null,
    createdAt: typeof m.created_at === "string" ? m.created_at : null,
    updatedAt: typeof m.updated_at === "string" ? m.updated_at : null,
    maxIterations: Number.isFinite(m.max_iterations) ? m.max_iterations : null,
    confirmation: name(m.confirmation_policy),
    securityAnalyzer: name(m.security_analyzer),
    agentProfile: name(m.launched_agent_profile),
    parent: typeof m.parent_conversation_id === "string" ? m.parent_conversation_id : null,
    forkedFrom: typeof m.forked_from_conversation_id === "string" ? m.forked_from_conversation_id : null,
    tags,
  };
}

function usage(value) {
  const um = value?.stats?.usage_to_metrics ?? value?.usage_to_metrics;
  if (!isObj(um)) return null;
  const t = { prompt: 0, completion: 0, cost: 0, models: [] };
  for (const u of Object.values(um)) {
    if (!isObj(u)) continue;
    const tu = isObj(u.accumulated_token_usage) ? u.accumulated_token_usage : {};
    t.prompt += Number(tu.prompt_tokens) || 0;
    t.completion += Number(tu.completion_tokens) || 0;
    t.cost += Number(u.accumulated_cost) || 0;
    const model = u.model_name ?? tu.model;
    if (model && !t.models.includes(model)) t.models.push(model);
  }
  return t;
}

function summarize(dir, id) {
  const eventsDir = join(dir, "events");
  if (!existsSync(eventsDir)) return null;
  const files = readdirSync(eventsDir).filter((f) => f.startsWith("event-") && f.endsWith(".json")).sort();
  const c = { id, ...meta(dir), events: 0, byKind: {}, tools: {}, actions: 0, thinking: 0, thought: 0, risks: {}, agentErrors: {}, conversationErrors: 0, hooks: 0, hooksBlocked: 0, condensations: 0, interrupts: 0, pauses: 0, startedAt: null, endedAt: null, usage: null };
  const open = new Map();
  for (const f of files) {
    const e = readJson(join(eventsDir, f));
    if (!isObj(e)) continue;
    c.events += 1;
    c.byKind[e.kind] = (c.byKind[e.kind] ?? 0) + 1;
    const t = typeof e.timestamp === "string" ? Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/.test(e.timestamp) ? e.timestamp : `${e.timestamp}Z`) : NaN;
    if (!Number.isNaN(t)) { if (c.startedAt === null || t < c.startedAt) c.startedAt = t; if (c.endedAt === null || t > c.endedAt) c.endedAt = t; }
    if (e.kind === "ActionEvent") {
      c.actions += 1;
      const tool = (c.tools[e.tool_name] ??= { calls: 0, errors: 0, ms: 0 });
      tool.calls += 1;
      if (e.reasoning_content || (Array.isArray(e.thinking_blocks) && e.thinking_blocks.length)) c.thinking += 1;
      if (Array.isArray(e.thought) && e.thought.some((x) => isObj(x) && typeof x.text === "string" && x.text.trim())) c.thought += 1;
      const risk = e.security_risk && e.security_risk !== "UNKNOWN" ? e.security_risk : "UNKNOWN";
      c.risks[risk] = (c.risks[risk] ?? 0) + 1;
      open.set(e.id, { tool, t });
    } else if (e.kind === "ObservationEvent") {
      const a = open.get(e.action_id);
      if (a && !Number.isNaN(t)) a.tool.ms += Math.max(0, t - a.t);
      const o = e.observation;
      if (a && isObj(o) && (o.is_error === true || (typeof o.exit_code === "number" && o.exit_code !== 0 && o.exit_code !== -1))) a.tool.errors += 1;
    } else if (e.kind === "AgentErrorEvent") {
      const k = (isObj(e.classification) ? e.classification.kind : e.classification) ?? "unclassified";
      c.agentErrors[k] = (c.agentErrors[k] ?? 0) + 1;
    } else if (e.kind === "ConversationErrorEvent") c.conversationErrors += 1;
    else if (e.kind === "HookExecutionEvent") { c.hooks += 1; if (e.blocked) c.hooksBlocked += 1; }
    else if (e.kind === "Condensation") c.condensations += 1;
    else if (e.kind === "InterruptEvent") c.interrupts += 1;
    else if (e.kind === "PauseEvent") c.pauses += 1;
    else if (e.kind === "ConversationStateUpdateEvent" && (e.key === "stats" || e.key === "full_state")) c.usage = usage(e.value) ?? c.usage;
  }
  return c;
}

const seen = new Set();
const conversations = [];
for (const folder of FOLDERS) {
  const base = join(root, folder);
  if (!existsSync(base)) continue;
  for (const id of readdirSync(base)) {
    if (seen.has(id)) continue;
    const s = summarize(join(base, id), id);
    if (s) { seen.add(id); conversations.push(s); }
  }
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), root, conversations }));
console.log(`Summarized ${conversations.length} conversations (${conversations.reduce((n, c) => n + c.events, 0)} events) into ${out}`);
