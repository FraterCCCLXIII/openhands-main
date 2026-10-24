#!/usr/bin/env node
// Applies what the page recorded for each project (its local.json) back to
// that project's source of truth:
// - kosmos projects: through the repo's own tools/pm/apply.mjs (tasks/*.jsonl);
// - GitHub projects: through gh, as label changes, comments and new issues.
// Dry run unless --write. --clear then marks what was applied in local.json,
// the way tools/pm/apply.mjs --clear does.
// Usage: node apply.mjs <org/repo | all> [--write] [--clear] [--hub <dir>]
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_LABELS } from "./adapters/github.mjs";
import { DEFAULT_HUB_DIR, projectFile, readHub, writeJsonAtomic } from "./hub/hub.mjs";

const STATUS_LABELS = ["ready", "building", "verify", "blocked", "backlog"];
const number = (card) => String(card ?? "").match(/^(GH|PR)\.(\d+)$/);

/**
 * The gh commands one GitHub project's overlay asks for. Pure: nothing runs.
 * @returns {{ steps: { args: string[], note: string, mark: [string, string, string?] }[], skipped: string[] }}
 *   `mark` is [collection, id, how] for --clear: delete, applied or status.
 */
export function planGithub(overlay, project, { labels = DEFAULT_LABELS, current = {} } = {}) {
  const col = overlay.collections ?? overlay;
  const repo = ["--repo", project.id];
  const steps = [], skipped = [];
  for (const [id, s] of Object.entries(col.cardstate ?? {})) {
    if (!s) continue;
    const m = number(s.card ?? id);
    if (!m) { skipped.push(`cardstate/${id}: ${s.card} is not a GitHub issue or PR`); continue; }
    const [, kind, n] = m;
    const noun = kind === "GH" ? "issue" : "pr";
    if (s.col === "done") {
      if (kind === "PR") { skipped.push(`cardstate/${id}: a pull request is done when it merges`); continue; }
      steps.push({ args: ["issue", "close", n, ...repo], note: `close #${n}`, mark: ["cardstate", id, "delete"] });
      continue;
    }
    const add = labels[s.col]?.[0];
    if (!add) { skipped.push(`cardstate/${id}: no label for column ${s.col}`); continue; }
    const have = (current[s.card] ?? []).map((x) => x.toLowerCase());
    const remove = STATUS_LABELS.filter((k) => k !== s.col).flatMap((k) => labels[k] ?? []).filter((l) => have.includes(l));
    if (current[`${s.card}:closed`]) steps.push({ args: [noun, "reopen", n, ...repo], note: `reopen #${n}`, mark: null });
    steps.push({ args: [noun, "edit", n, ...repo, "--add-label", add, ...remove.flatMap((l) => ["--remove-label", l])], note: `#${n} to ${s.col} (label ${add})`, mark: ["cardstate", id, "delete"] });
  }
  for (const [id, d] of Object.entries(col.decisions ?? {})) {
    if (!d || d.applied) continue;
    const m = number(d.card ?? id);
    if (!m) { skipped.push(`decisions/${id}: no issue for ${d.card}`); continue; }
    steps.push({ args: [m[1] === "GH" ? "issue" : "pr", "comment", m[2], ...repo, "--body", `Decision (${String(d.at ?? "").slice(0, 10)}): ${d.answer}`], note: `answer on #${m[2]}`, mark: ["decisions", id, "applied"] });
  }
  for (const [id, item] of Object.entries(col.inbox ?? {})) {
    if (!item || item.status !== "confirmed") continue;
    for (const a of item.route?.actions ?? []) {
      const m = a.type === "note" && number(a.card);
      if (m) steps.push({ args: [m[1] === "GH" ? "issue" : "pr", "comment", m[2], ...repo, "--body", `Note (${String(item.at ?? "").slice(0, 10)}): ${a.text}`], note: `note on #${m[2]}`, mark: null });
    }
    steps.push({ args: [], note: `inbox/${id} recorded`, mark: ["inbox", id, "status"] });
  }
  for (const [id, p] of Object.entries(col.proposals ?? {})) {
    if (!p || p.status !== "confirmed") continue;
    const body = [p.note ?? "From the Projects composer.", "", p.gate && !/^TODO/.test(p.gate) ? `Gate: ${p.gate}` : "", (p.deps ?? []).length ? `Depends on ${p.deps.map((x) => `#${String(x).replace(/^\D+\./, "")}`).join(", ")}` : ""].filter(Boolean).join("\n");
    steps.push({ args: ["issue", "create", ...repo, "--title", p.title, "--body", body], note: `new issue: ${p.title}`, mark: ["proposals", id, "status"] });
  }
  return { steps, skipped };
}

/** Marks what ran in the overlay, the way tools/pm/apply.mjs --clear does. */
export function clearApplied(overlay, marks) {
  const col = overlay.collections;
  for (const { mark, created } of marks) {
    if (!mark) continue;
    const [name, id, how] = mark;
    if (how === "delete") col[name][id] = null;
    if (how === "applied") col[name][id] = { ...col[name][id], applied: true };
    if (how === "status") col[name][id] = { ...col[name][id], status: "applied", ...(created ? { card: created } : {}) };
  }
  return overlay;
}

function applyKosmos(project, overlay, { write, clear }) {
  const dir = mkdtempSync(join(tmpdir(), "pm-hub-apply-"));
  const file = join(dir, "overlay.json");
  try {
    writeFileSync(file, JSON.stringify(overlay));
    const args = [join(project.path, "tools", "pm", "apply.mjs"), file, ...(write ? ["--write"] : []), ...(write && clear ? ["--clear"] : [])];
    console.log(execFileSync(process.execPath, args, { cwd: project.path, encoding: "utf8" }).trim());
    return write && clear ? JSON.parse(readFileSync(file, "utf8")) : null;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function applyGithub(project, overlay, snapshot, { write, clear }) {
  const current = {};
  for (const c of Object.values(snapshot?.collections?.cards ?? {})) {
    current[c.id] = c.labels ?? [];
    if (c.status === "done") current[`${c.id}:closed`] = true;
  }
  const { steps, skipped } = planGithub(overlay, project, { labels: project.labels ?? DEFAULT_LABELS, current });
  for (const s of skipped) console.log(`  skipped ${s}`);
  const done = [];
  for (const step of steps) {
    if (!step.args.length) { done.push(step); continue; }
    console.log(`  gh ${step.args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(" ")}`);
    if (!write) continue;
    try {
      const out = execFileSync("gh", step.args, { cwd: project.path, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
      const created = step.args[1] === "create" ? `GH.${out.match(/\/issues\/(\d+)/)?.[1]}` : null;
      done.push({ ...step, created });
    } catch (error) {
      console.log(`  failed: ${String(error.stderr || error.message).trim().split("\n")[0]}`);
    }
  }
  console.log(`${steps.filter((s) => s.args.length).length} gh commands${write ? `, ${done.filter((s) => s.args.length).length} ran` : " (dry run; --write to run them)"}`);
  return write && clear ? clearApplied(overlay, done) : null;
}

export function main(argv) {
  const opt = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const hubDir = resolve(opt("--hub") ?? DEFAULT_HUB_DIR);
  const target = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--hub");
  if (!target) throw new Error("usage: node apply.mjs <org/repo | all> [--write] [--clear] [--hub <dir>]");
  const hub = readHub(hubDir);
  const projects = hub.projects.filter((p) => target === "all" || p.id === target);
  if (!projects.length) throw new Error(`No project ${target} in ${hubDir}/hub.json.`);
  const flags = { write: argv.includes("--write"), clear: argv.includes("--clear") };
  for (const p of projects) {
    const read = (f) => {
      try {
        return JSON.parse(readFileSync(join(hubDir, projectFile(p.id, f)), "utf8"));
      } catch {
        return null;
      }
    };
    const overlay = read("local.json");
    if (!overlay || !Object.values(overlay.collections ?? {}).some((d) => Object.keys(d).length)) {
      console.log(`${p.id}: nothing recorded`);
      continue;
    }
    console.log(`${p.id} (${p.adapter}):`);
    const cleared = p.adapter === "kosmos" ? applyKosmos(p, overlay, flags) : applyGithub(p, overlay, read("snapshot.json"), flags);
    if (cleared) writeJsonAtomic(join(hubDir, projectFile(p.id, "local.json")), cleared);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}
