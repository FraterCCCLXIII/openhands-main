#!/usr/bin/env node
// Scans a git checkout and packs every local branch, stash and worktree into
// the snapshot.json the Work Inventory app reads. Notes and verdicts in
// seed-notes.json ride along as the `meta` collection; edits made on the page
// go to local.json and win over them.
// Usage: node sync.mjs [--repo <checkout>] [--base <branch>] [--data-dir <dir>]
//                      [--github]            also fetch commits and PRs with `gh` (slow)
//                      [--roadmap-dir <dir>]  Kosmos Roadmap data dir, for the card picker
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const DEFAULT_DATA_DIR = join(homedir(), ".openhands", "work-inventory");
const DEFAULT_ROADMAP_DIR = join(homedir(), ".openhands", "kosmos-roadmap");
const here = dirname(fileURLToPath(import.meta.url));

export function itemId(kind, name) {
  return `${kind}:${name}`.replace(/[/\s]/g, "~");
}

/** "origin/foo" is gone upstream when git prints `[gone]` in the track field. */
export function pushState({ upstream, track, ahead, unpushed }) {
  if (!upstream) return "never";
  if (track === "[gone]") return "gone";
  if (ahead > 0 && unpushed === 0) return "pushed";
  if (unpushed > 0) return "unpushed";
  return "pushed";
}

/** Parses `git worktree list --porcelain`. */
export function parseWorktrees(text) {
  const trees = [];
  let current = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("worktree ")) {
      current = { path: line.slice(9), branch: null, prunable: false };
      trees.push(current);
    } else if (current && line.startsWith("branch ")) {
      current.branch = line.slice(7).replace(/^refs\/heads\//, "");
    } else if (current && line.startsWith("prunable")) {
      current.prunable = true;
    }
  }
  return trees;
}

/** Splits `git stash list --format=%gd|%cs|%H|%gs` lines. */
export function parseStashes(text) {
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [ref, date, sha, ...rest] = line.split("|");
      const subject = rest.join("|");
      const branch = /^(?:WIP on|On) ([^:]+):/.exec(subject)?.[1] ?? null;
      return { ref, date, sha, subject, branch };
    });
}

function groupOf(name, kind) {
  if (kind === "stash") return "stash";
  if (kind === "worktree") return "worktree";
  if (name.startsWith("archive/")) return "archive";
  if (name.startsWith("squash/") || name.startsWith("pr-")) return "pr-copy";
  return "feature";
}

export function collectItems(git, base = "main") {
  const items = {};
  const dirtyByBranch = {};
  const trees = parseWorktrees(git(["worktree", "list", "--porcelain"]));
  for (const tree of trees) {
    let dirty = 0;
    let usable = existsSync(tree.path);
    if (usable) {
      try {
        dirty = execFileSync("git", ["-C", tree.path, "status", "--porcelain"], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        })
          .split("\n")
          .filter(Boolean).length;
      } catch {
        usable = false;
      }
    }
    if (tree.branch && usable) dirtyByBranch[tree.branch] = { dirty, path: tree.path };
    items[itemId("worktree", tree.path)] = {
      kind: "worktree",
      name: tree.path,
      branch: tree.branch,
      dirty,
      group: "worktree",
      prunable: tree.prunable || !usable,
    };
  }

  const refs = git([
    "for-each-ref",
    "--format=%(refname:short)|%(upstream:short)|%(upstream:track)|%(committerdate:short)|%(contents:subject)",
    "refs/heads",
  ]).split("\n");
  for (const line of refs.filter(Boolean)) {
    const [name, upstream, track, date, ...subject] = line.split("|");
    if (name === base) continue;
    const ahead = Number(git(["rev-list", "--count", `${base}..${name}`]));
    if (ahead === 0 && !dirtyByBranch[name]) continue;
    const unpushed = upstream
      ? Number(git(["rev-list", "--count", `${upstream}..${name}`]))
      : ahead;
    items[itemId("branch", name)] = {
      kind: "branch",
      name,
      ahead,
      unpushed,
      push: pushState({ upstream, track, ahead, unpushed }),
      lastCommit: date,
      subject: subject.join("|"),
      dirty: dirtyByBranch[name]?.dirty ?? 0,
      worktree: dirtyByBranch[name]?.path ?? null,
      group: groupOf(name, "branch"),
    };
  }

  for (const stash of parseStashes(
    git(["stash", "list", "--format=%gd|%cs|%H|%gs"]),
  )) {
    items[itemId("stash", stash.ref)] = {
      kind: "stash",
      name: stash.ref,
      sha: stash.sha,
      branch: stash.branch,
      lastCommit: stash.date,
      subject: stash.subject,
      group: "stash",
    };
  }
  return items;
}

/**
 * Gives every item a permanent number. `registry` is `{ next, ids }` from the
 * previous run; an item keeps its number for good, new ones continue from
 * `next`, and a number is never reused. Stashes are keyed by commit because
 * `stash@{n}` shifts whenever an older stash is dropped.
 */
export function assignNumbers(items, registry = { next: 1, ids: {} }) {
  const ids = { ...registry.ids };
  let next = registry.next;
  const keyOf = (id, item) => (item.kind === "stash" && item.sha ? `stash#${item.sha}` : id);
  const order = Object.keys(items).sort((a, b) => {
    const [x, y] = [items[a], items[b]];
    return (y.lastCommit ?? "").localeCompare(x.lastCommit ?? "") || a.localeCompare(b);
  });
  const numbered = {};
  for (const id of order) {
    if (items[id].kind === "ticket") {
      numbered[id] = items[id];
      continue;
    }
    const key = keyOf(id, items[id]);
    if (!ids[key]) ids[key] = next++;
    numbered[id] = { ...items[id], num: ids[key] };
  }
  return { items: numbered, registry: { next, ids } };
}

/**
 * Turns seed-tickets.json into future-work items plus their starting metadata.
 * Tickets are numbered T-001 and up by their own `num`, not by the WI registry.
 */
export function ticketItems(tickets, today = new Date().toISOString().slice(0, 10)) {
  const items = {};
  const meta = {};
  for (const t of tickets) {
    const id = itemId("ticket", `T-${String(t.num).padStart(3, "0")}`);
    items[id] = { kind: "ticket", name: t.title, group: "ticket", lastCommit: today, num: t.num };
    meta[id] = {
      stage: t.stage,
      category: t.category,
      priority: t.priority ?? "",
      tags: t.tags ?? [],
      notes: t.notes ?? "",
      status: "keep",
    };
  }
  return { items, meta };
}

/** Flattens the Kosmos Roadmap snapshot's `registry` chunks into `{ id: {t, s, track} }`. */
export function readCards(roadmapSnapshotText) {
  if (!roadmapSnapshotText) return {};
  const registry = JSON.parse(roadmapSnapshotText).collections?.registry ?? {};
  const cards = {};
  for (const chunk of Object.values(registry)) {
    for (const card of chunk.cards ?? []) {
      cards[card.id.replace(/[/\s]/g, "~")] = {
        id: card.id,
        t: card.t,
        s: card.s,
        track: card.track,
      };
    }
  }
  return cards;
}

/** process.json is an ordered list of design-process steps; the page reads them as docs keyed by step id. */
export function processSteps(steps) {
  return Object.fromEntries(steps.map((step) => [step.id, step]));
}

export function buildSnapshot(items, seed = {}, cards = {}, ticketMeta = {}, process = {}) {
  const meta = { ...ticketMeta };
  for (const [key, note] of Object.entries(seed)) {
    const [kind, ...rest] = key.split(":");
    const id = itemId(kind, rest.join(":"));
    if (items[id]) meta[id] = note;
  }
  return {
    generatedAt: new Date().toISOString(),
    collections: { items, meta, cards, process },
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (name, fallback) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : fallback;
  };
  const repo = resolve(opt("--repo", process.cwd()));
  const dataDir = resolve(opt("--data-dir", DEFAULT_DATA_DIR));
  const base = opt("--base", "main");
  const git = (args) =>
    execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
  const seedFile = join(here, "seed-notes.json");
  const seed = existsSync(seedFile)
    ? JSON.parse(readFileSync(seedFile, "utf8"))
    : {};
  mkdirSync(dataDir, { recursive: true });
  const idsFile = join(dataDir, "ids.json");
  const previous = existsSync(idsFile)
    ? JSON.parse(readFileSync(idsFile, "utf8"))
    : undefined;
  const ticketsFile = join(here, "seed-tickets.json");
  const tickets = ticketItems(
    existsSync(ticketsFile) ? JSON.parse(readFileSync(ticketsFile, "utf8")) : [],
  );
  const numbered = assignNumbers(
    { ...collectItems(git, base), ...tickets.items },
    previous,
  );
  writeFileSync(idsFile, JSON.stringify(numbered.registry));
  const roadmapFile = join(resolve(opt("--roadmap-dir", DEFAULT_ROADMAP_DIR)), "snapshot.json");
  const cards = readCards(existsSync(roadmapFile) ? readFileSync(roadmapFile, "utf8") : null);
  const snapshot = buildSnapshot(
    numbered.items,
    seed,
    cards,
    tickets.meta,
    processSteps(
      existsSync(join(here, "process.json"))
        ? JSON.parse(readFileSync(join(here, "process.json"), "utf8"))
        : [],
    ),
  );
  // Commits and PRs come from `gh` and are slow, so a plain sync keeps the
  // previous ones and only --github refreshes them.
  const snapshotPath = join(dataDir, "snapshot.json");
  const earlier = existsSync(snapshotPath)
    ? JSON.parse(readFileSync(snapshotPath, "utf8")).collections ?? {}
    : {};
  if (argv.includes("--github")) {
    const { collectGithub } = await import("./github.mjs");
    const config = JSON.parse(readFileSync(join(here, "github-repos.json"), "utf8"));
    Object.assign(snapshot.collections, collectGithub(config));
  } else {
    snapshot.collections.commits = earlier.commits ?? {};
    snapshot.collections.prs = earlier.prs ?? {};
  }
  const target = join(dataDir, "snapshot.json");
  writeFileSync(`${target}.tmp`, JSON.stringify(snapshot));
  renameSync(`${target}.tmp`, target);
  console.log(
    `Wrote ${target}: ${Object.keys(snapshot.collections.items).length} items, ${Object.keys(snapshot.collections.commits).length} commits, ${Object.keys(snapshot.collections.prs).length} PRs, ${Object.keys(snapshot.collections.meta).length} seeded notes, ${Object.keys(cards).length} roadmap cards`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
