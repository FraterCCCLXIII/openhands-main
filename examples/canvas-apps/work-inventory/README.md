# Work Inventory (Canvas App)

A sortable, editable dashboard of every local branch, stash and worktree in a
git checkout: how far ahead of `main` it is, whether it was ever pushed,
whether it has uncommitted changes, plus a status, priority, owner, link, tags
and notes you set on the page. It follows the Kosmos Roadmap app's layout.

## Files

- `page.html`: the page. Click a header to sort; the stat tiles are quick
  filters ("At risk" means never pushed, unpushed commits, a remote that is
  gone, uncommitted changes, or an unreviewed stash). Click a row to edit its
  metadata. **Copy Markdown** and **Copy CSV** export the filtered rows.
- `sync.mjs`: scans a checkout and writes `snapshot.json`.
- `seed-notes.json`: starting notes and statuses, keyed `kind:name`
  (`stash:stash@{0}`, `branch:feat/x`). `sync.mjs` includes the ones whose item
  still exists. Edit this file to seed other notes.
- `inventory-db.js`: the db adapter, the same one the Kosmos Roadmap app uses.
- `entry.js`, `build.mjs`: the Canvas App entry and the packager.

## Tabs, stages and tickets

- **Work** is the git inventory. Every row has an SDLC **Stage** (intake,
  discovery, design, spec, ready, building, review, verify, release, monitor,
  blocked, done) and a **Category** (feature, bug, design, research, tech-debt,
  docs, test, security, release, monitoring, tooling, chore). The stage strip
  filters on a click. Until you set a stage, branches and stashes show a guess
  from their push state.
- **Design process** is a row of eight modules under the stage strip: intake,
  discovery, design, spec, build, review, verify and ship. Each shows its exit
  criteria, what it produces, and how many items sit in its stages; **Show
  these** filters the table. Open any row to tick its checklist; the **Process**
  column shows `done/32`. The steps live in `process.json`: edit it and re-run
  `sync.mjs` to change them. They follow the UX review flow in
  `.pr/ux-design-review-process.md` and the SDLC PR rules (evidence, HUMAN
  section).
- **+ New ticket** adds a future-work item (`T-###`). `seed-tickets.json` holds
  the starting tickets; edit it and re-run `sync.mjs` to add more.
- **Commits** and **Pull requests** list what `FraterCCCLXIII` authored in the
  `OpenHands` org and the personal repos in `github-repos.json`. They come from
  the `gh` CLI, which is slow, so only `node sync.mjs --github` refreshes them;
  a plain sync keeps the last ones.

## Data

Both files live in one data directory on the Agent Server's machine, by
default `~/.openhands/work-inventory`.

| File | Written by | Holds |
|---|---|---|
| `snapshot.json` | `sync.mjs` | `items` (facts from git) and `meta` (seed notes) |
| `local.json` | the page | Your edits, one `meta` document per item. They win over seed notes, and a sync never touches them. |

Item ids are `kind:name` with `/` and spaces replaced by `~`.

## Use

```bash
cd examples/canvas-apps/work-inventory
node sync.mjs --repo /path/to/checkout     # re-run any time to refresh the facts
node build.mjs
```

To install, open **Customize > Apps**, choose **Add app**, and enter the
absolute path of `dist/`. **Work Inventory** appears in the sidebar at
`/extensions/work-inventory/inventory`.

`build.mjs` also writes `dist/work-inventory.html` with the snapshot inlined.
Open it straight from disk to use the dashboard without Canvas; edits then live
in that browser's `localStorage` only.

Like every Canvas App, the installed version needs a local Agent Server.
