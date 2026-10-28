---
name: design-triage
description: >
  This skill should be used to "list design PRs", "what design work is open",
  "show design-related issues", "which PRs touch the UI", or "triage open UI
  work". It runs scripts/list-design-items.mjs to list open OpenHands/OpenHands
  pull requests and issues that are design-related or touch the Canvas UI.
triggers:
- /design-triage
- design PRs
- design issues
---

# Design triage

Lists open design-related work on `OpenHands/OpenHands` using the GitHub CLI.

## Run it

```bash
node scripts/list-design-items.mjs --strict
```

Flags:

- `--strict` drops items that match only the broad UI-surface keywords
  (modal, dialog, sidebar, panel, ...). Use it for a tighter list.
- `--prs` or `--issues` limits the output to one kind.
- `--json` prints machine-readable rows (`kind`, `number`, `title`, `url`,
  `labels`, `author`, `updatedAt`, `isDraft`, `reasons`).

Requires `gh auth status` to succeed.

## How items are matched

An open item is included when any of these hold:

1. **label**: a label is `UI/UX`, `ui`, `ux`, `GUI`, `Needs Design`, `design`,
   `visual`, or `type: style`.
2. **title**: the title contains design wording (design, redesign, mockup, UI,
   UX, visual, style, theme, contrast, layout, responsive, a11y, accessibility,
   typography, icon, spacing, animation, polish, color, palette, marquee).
3. **branch**: the head branch name contains the same wording.
4. **ui-surface**: only the broader UI nouns match (modal, dialog, sidebar,
   button, card, banner, composer, panel, and similar). `--strict` drops these.

The PR body is intentionally not searched. Most PR bodies include the
`pr-design-doc` template, so body matches would flag almost every PR.

## Reporting

Present the Markdown table the script prints, or summarize by theme (themes and
contrast, accessibility, automations UI, chat UI) when the user wants an overview.
Note that matching is heuristic: a PR can touch the UI without matching, and a
match can be a false positive such as a "UI crash" fix. Check the `Why` column.

## Scope

This skill only reads GitHub. It does not label, comment on, or change any PR or
issue.
