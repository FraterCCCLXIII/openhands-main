#!/usr/bin/env node

// Lists open PRs and issues that are design-related or touch the UI.
//
// Usage:
//   node scripts/list-design-items.mjs            # Markdown report, PRs and issues
//   node scripts/list-design-items.mjs --json     # machine-readable output
//   node scripts/list-design-items.mjs --prs      # only pull requests
//   node scripts/list-design-items.mjs --issues   # only issues
//   node scripts/list-design-items.mjs --strict   # drop the broad "UI surface" matches
//
// Requires an authenticated GitHub CLI (`gh auth status`).

import { spawnSync } from "node:child_process";
import process from "node:process";

const REPO = "OpenHands/OpenHands";
const LIMIT = "1000";

// Labels that mark an item as design work outright.
const DESIGN_LABELS = /^(ui\/ux|ui|ux|gui|needs design|design|visual|type: style)$/i;

// Title or branch wording that signals design work.
const DESIGN_KEYWORDS =
  /\b(design|redesign|mockups?|figma|ui|ux|visual|styl(e|es|ing)|css|themes?|light theme|dark mode|contrast|layout|responsive|a11y|accessib\w*|typography|fonts?|icons?|spacing|animations?|polish|pixel|colou?rs?|palette|marquee)\b/i;

// Broader UI surfaces. Items matching only these are reported separately so
// the strict view can drop them.
const UI_SURFACE_KEYWORDS =
  /\b(modals?|dialogs?|sidebars?|buttons?|cards?|banners?|tiles?|badges?|composer|menus?|panels?|dropdowns?|tooltips?|toasts?|pickers?|navbar|header|footer|onboarding|screens?|pages?|frontend|canvas)\b/i;

function gh(args) {
  const result = spawnSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.error) {
    throw new Error(`Failed to run gh: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`gh ${args.join(" ")} failed: ${result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout);
}

function fetchItems(kind) {
  const fields = kind === "pr"
    ? "number,title,url,labels,headRefName,isDraft,author,updatedAt"
    : "number,title,url,labels,author,updatedAt";
  const command = kind === "pr" ? "pr" : "issue";
  return gh([command, "list", "--repo", REPO, "--state", "open", "--limit", LIMIT, "--json", fields]);
}

/**
 * Returns the reasons an item is design-related, or an empty array.
 * Reasons: "label", "title", "branch", "ui-surface".
 */
export function classify(item) {
  const labelNames = item.labels.map((label) => label.name);
  const reasons = [];
  if (labelNames.some((name) => DESIGN_LABELS.test(name))) {
    reasons.push("label");
  }
  if (DESIGN_KEYWORDS.test(item.title)) {
    reasons.push("title");
  }
  if (item.headRefName && DESIGN_KEYWORDS.test(item.headRefName)) {
    reasons.push("branch");
  }
  if (reasons.length === 0 && UI_SURFACE_KEYWORDS.test(`${item.title} ${item.headRefName ?? ""}`)) {
    reasons.push("ui-surface");
  }
  return reasons;
}

function toRow(kind, item, reasons) {
  return {
    kind,
    number: item.number,
    title: item.title,
    url: item.url,
    labels: item.labels.map((label) => label.name),
    author: item.author?.login ?? null,
    updatedAt: item.updatedAt,
    isDraft: item.isDraft ?? false,
    reasons,
  };
}

function collect({ prs, issues, strict }) {
  const rows = [];
  const kinds = [];
  if (prs) kinds.push(["pr", fetchItems("pr")]);
  if (issues) kinds.push(["issue", fetchItems("issue")]);
  for (const [kind, items] of kinds) {
    for (const item of items) {
      const reasons = classify(item);
      if (reasons.length === 0) continue;
      if (strict && reasons.every((reason) => reason === "ui-surface")) continue;
      rows.push(toRow(kind, item, reasons));
    }
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function renderMarkdown(rows) {
  const lines = [];
  for (const kind of ["pr", "issue"]) {
    const group = rows.filter((row) => row.kind === kind);
    if (group.length === 0) continue;
    lines.push(`## Open ${kind === "pr" ? "pull requests" : "issues"} (${group.length})`, "");
    lines.push("| # | Title | Why | Labels | Updated |", "| --- | --- | --- | --- | --- |");
    for (const row of group) {
      const draft = row.isDraft ? " (draft)" : "";
      const labels = row.labels.join(", ") || "-";
      const updated = row.updatedAt.slice(0, 10);
      lines.push(
        `| [#${row.number}](${row.url}) | ${row.title.replaceAll("|", "\\|")}${draft} | ${row.reasons.join(", ")} | ${labels} | ${updated} |`,
      );
    }
    lines.push("");
  }
  return lines.length ? lines.join("\n") : "No design-related open PRs or issues found.\n";
}

function main(argv) {
  const flags = new Set(argv);
  const onlyPrs = flags.has("--prs");
  const onlyIssues = flags.has("--issues");
  const rows = collect({
    prs: !onlyIssues,
    issues: !onlyPrs,
    strict: flags.has("--strict"),
  });
  if (flags.has("--json")) {
    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
  } else {
    process.stdout.write(renderMarkdown(rows));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
