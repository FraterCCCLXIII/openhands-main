/** What an agent did to code: file edits as colored diffs, and git and GitHub commands. */

export interface DiffLine {
  type: "add" | "del" | "ctx";
  text: string;
}

export interface FileChange {
  path: string;
  kind: "edit" | "create" | "insert";
  added: number;
  removed: number;
  lines: DiffLine[];
  /** More lines were changed than are listed. */
  truncated: boolean;
}

export interface GitAction {
  /** The literal command, for example `git commit` or `gh pr create`. */
  command: string;
  detail?: string;
  /** A destructive or risky form: a force push, a hard reset. */
  warn?: boolean;
  sha?: string;
  url?: string;
}

const MAX_DIFF_LINES = 160;
const LCS_LIMIT = 400;

const split = (text: string): string[] => (text === "" ? [] : text.split("\n"));

/** A line diff: unchanged lines stay as context, the rest is removed and added. */
export function lineDiff(oldText: string, newText: string): DiffLine[] {
  const a = split(oldText);
  const b = split(newText);
  if (a.length > LCS_LIMIT || b.length > LCS_LIMIT) {
    return [
      ...a.map((text) => ({ type: "del" as const, text })),
      ...b.map((text) => ({ type: "add" as const, text })),
    ];
  }
  // Longest common subsequence table, from the end.
  const table = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: "ctx", text: a[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.push({ type: "del", text: a[i] });
      i += 1;
    } else {
      out.push({ type: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < a.length) out.push({ type: "del", text: a[i++] });
  while (j < b.length) out.push({ type: "add", text: b[j++] });
  return out;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** The diff a file editor action made, or null for a view or anything that changes no file. */
export function fileChangeOf(
  action: Record<string, unknown>,
): FileChange | null {
  const path = str(action.path);
  if (!path) return null;
  let kind: FileChange["kind"];
  let lines: DiffLine[];
  switch (action.command) {
    case "create":
      kind = "create";
      lines = split(str(action.file_text)).map((text) => ({
        type: "add" as const,
        text,
      }));
      break;
    case "str_replace":
      kind = "edit";
      lines = lineDiff(str(action.old_str), str(action.new_str));
      break;
    case "insert":
      kind = "insert";
      lines = split(str(action.new_str)).map((text) => ({
        type: "add" as const,
        text,
      }));
      break;
    default:
      return null;
  }
  return {
    path,
    kind,
    added: lines.filter((l) => l.type === "add").length,
    removed: lines.filter((l) => l.type === "del").length,
    lines: lines.slice(0, MAX_DIFF_LINES),
    truncated: lines.length > MAX_DIFF_LINES,
  };
}

/** Folds the changes of several steps into one entry per file, in order. */
export function mergeChanges(changes: FileChange[]): FileChange[] {
  const byPath = new Map<string, FileChange>();
  changes.forEach((c) => {
    const known = byPath.get(c.path);
    if (!known) {
      byPath.set(c.path, { ...c, lines: [...c.lines] });
      return;
    }
    known.added += c.added;
    known.removed += c.removed;
    known.lines = [...known.lines, ...c.lines].slice(0, MAX_DIFF_LINES);
    known.truncated ||= c.truncated || known.lines.length >= MAX_DIFF_LINES;
  });
  return [...byPath.values()];
}

/** Splits a shell line into the commands joined by `&&`, `||`, `;` and pipes (outside quotes). */
function commandsOf(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
      current += c;
    } else if (c === '"' || c === "'") {
      quote = c;
      current += c;
    } else if (c === ";" || c === "|" || (c === "&" && line[i + 1] === "&")) {
      if (c === "&" || (c === "|" && line[i + 1] === "|")) i += 1;
      out.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  out.push(current.trim());
  return out.filter(Boolean);
}

/** Words of a command with quotes removed, so `-m "a b"` is one word. */
function words(command: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m = re.exec(command);
  while (m) {
    out.push(m[1] ?? m[2] ?? m[3]);
    m = re.exec(command);
  }
  return out;
}

const flagValue = (w: string[], ...names: string[]): string | undefined => {
  const i = w.findIndex((x) => names.includes(x));
  return i >= 0 ? w[i + 1] : undefined;
};

const positional = (w: string[]): string[] =>
  w.filter((x) => !x.startsWith("-"));

const PR_URL = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/;
const COMMIT_LINE = /^\[[^\]]*?\s([0-9a-f]{7,40})\]/m;

/** The git and GitHub commands in a shell line, with what each one touched. */
export function gitActionsOf(commandLine: string, result = ""): GitAction[] {
  const actions: GitAction[] = [];
  commandsOf(commandLine).forEach((cmd) => {
    const w = words(cmd).filter((x) => !x.includes("="));
    // Skip `cd dir`, env prefixes and the like: look for git or gh.
    const start = words(cmd).findIndex((x) => x === "git" || x === "gh");
    if (start < 0) return;
    const parts = words(cmd).slice(start);
    const tool = parts[0];
    // `git -C dir commit`: drop the option and its value.
    const rest = parts.slice(1);
    const cIdx = rest.indexOf("-C");
    const args =
      cIdx >= 0 ? [...rest.slice(0, cIdx), ...rest.slice(cIdx + 2)] : rest;
    const verb = args.find((x) => !x.startsWith("-"));
    if (!verb) return;
    const after = args.slice(args.indexOf(verb) + 1);
    const base = `${tool} ${verb}`;
    void w;
    if (tool === "git") {
      switch (verb) {
        case "commit": {
          const msg =
            flagValue(after, "-m", "--message") ?? flagValue(after, "-am");
          actions.push({
            command: after.includes("--amend") ? "git commit --amend" : base,
            detail: msg,
            sha: COMMIT_LINE.exec(result)?.[1],
          });
          break;
        }
        case "push": {
          const force = after.some(
            (x) => x === "--force" || x === "-f" || x === "--force-with-lease",
          );
          const p = positional(after);
          actions.push({
            command: force ? "git push --force" : base,
            detail: p.join(" ") || undefined,
            warn: force,
          });
          break;
        }
        case "pull":
        case "fetch":
        case "merge":
        case "rebase":
        case "cherry-pick":
        case "revert":
        case "tag":
        case "clone":
        case "stash":
        case "add":
        case "rm":
        case "mv":
        case "restore":
          actions.push({
            command: base,
            detail: positional(after).join(" ") || undefined,
          });
          break;
        case "checkout":
        case "switch": {
          const created =
            after.includes("-b") ||
            after.includes("-c") ||
            after.includes("-B");
          actions.push({
            command: created ? `${base} (new branch)` : base,
            detail: positional(after)[0],
          });
          break;
        }
        case "branch":
          actions.push({
            command: base,
            detail: positional(after).join(" ") || undefined,
            warn: after.includes("-D"),
          });
          break;
        case "worktree":
          actions.push({
            command: `${base} ${positional(after)[0] ?? ""}`.trim(),
            detail: positional(after).slice(1).join(" ") || undefined,
          });
          break;
        case "reset": {
          const hard = after.includes("--hard");
          actions.push({
            command: hard ? "git reset --hard" : base,
            detail: positional(after).join(" ") || undefined,
            warn: hard,
          });
          break;
        }
        default:
          break;
      }
      return;
    }
    // gh: `gh pr create`, `gh issue comment`, `gh api ...`, `gh run view`.
    const noun = verb;
    const sub = after.find((x) => !x.startsWith("-"));
    if (
      ["pr", "issue", "release", "run", "workflow", "repo"].includes(noun) &&
      sub
    ) {
      const url = PR_URL.exec(result)?.[0];
      actions.push({
        command: `gh ${noun} ${sub}`,
        detail:
          flagValue(after, "--title", "-t") ?? positional(after.slice(1))[0],
        url: noun === "pr" ? url : undefined,
        warn: noun === "pr" && sub === "merge" ? false : undefined,
      });
    } else if (noun === "api") {
      actions.push({ command: "gh api", detail: sub });
    }
  });
  return actions;
}
