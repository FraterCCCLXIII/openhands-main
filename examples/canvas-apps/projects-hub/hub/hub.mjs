// The hub data directory (README.md "Hub data"): hub.json indexes orgs and
// projects; projects/<org>/<repo>/ holds each project's snapshot.json and
// local.json.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";

export const DEFAULT_HUB_DIR = join(homedir(), ".openhands", "pm-hub");
export const HUB_FILE = "hub.json";
export const ADAPTERS = ["kosmos", "github"];

export const emptyHub = () => ({ schema: "pm-hub.hub", version: 1, tools: {}, orgs: [], projects: [] });

export function writeJsonAtomic(file, data) {
  mkdirSync(resolve(file, ".."), { recursive: true });
  // Write then rename so the app never reads a half-written file.
  writeFileSync(`${file}.tmp`, typeof data === "string" ? data : JSON.stringify(data, null, 1));
  renameSync(`${file}.tmp`, file);
}

export function readHub(hubDir) {
  const file = join(hubDir, HUB_FILE);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : emptyHub();
}

export function writeHub(hubDir, hub) {
  writeJsonAtomic(join(hubDir, HUB_FILE), hub);
}

/** Relative to the hub dir, so the page can read it through the Agent Server's file API. */
export const projectFile = (id, file) => `projects/${id}/${file}`;

/** org and repo from the checkout's origin remote, else from its folder name. */
export function detectRepo(path) {
  let url = "";
  try {
    url = execFileSync("git", ["remote", "get-url", "origin"], { cwd: path, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {}
  const m = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (m) return { org: m[1], repo: m[2], url: `https://github.com/${m[1]}/${m[2]}` };
  return { org: "local", repo: basename(path), url: null };
}

/** Adds or replaces one project; its org is created when new. */
export function addProject(hub, { path, adapter, org, repo, name, usage, branch, labels }) {
  const abs = resolve(path);
  const found = detectRepo(abs);
  org ??= found.org;
  repo ??= found.repo;
  adapter ??= existsSync(join(abs, "tools", "pm", "refresh.mjs")) ? "kosmos" : "github";
  if (!ADAPTERS.includes(adapter)) throw new Error(`Unknown adapter ${adapter}; use ${ADAPTERS.join(" or ")}.`);
  const id = `${org}/${repo}`;
  const old = hub.projects.find((p) => p.id === id);
  const project = {
    id, org, repo, name: name ?? old?.name ?? repo, path: abs, url: found.org === org && found.repo === repo ? found.url : old?.url ?? null, adapter,
    // refresh.mjs already measures usage for kosmos repos.
    usage: usage ?? old?.usage ?? adapter !== "kosmos",
    ...(branch ?? old?.branch ? { branch: branch ?? old.branch } : {}),
    ...(labels ?? old?.labels ? { labels: labels ?? old.labels } : {}),
    lastSync: old?.lastSync ?? null,
  };
  hub.projects = [...hub.projects.filter((p) => p.id !== id), project].sort((a, b) => a.id.localeCompare(b.id));
  if (!hub.orgs.some((o) => o.id === org)) hub.orgs = [...hub.orgs, { id: org, name: org }].sort((a, b) => a.id.localeCompare(b.id));
  if (adapter === "kosmos" && !hub.tools.pm) hub.tools.pm = join(abs, "tools", "pm");
  return project;
}

/** What a snapshot says about its project: hub.json's entry without hub bookkeeping. */
export const projectInfo = ({ id, org, repo, name, path, url, adapter, branch }) => ({ id, org, repo, name, path, url: url ?? undefined, adapter, ...(branch ? { branch } : {}) });
