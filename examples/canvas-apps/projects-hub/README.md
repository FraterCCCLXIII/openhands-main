# Projects (Canvas App)

The Kosmos Roadmap page, generalized to every repository you work on, grouped by organization and project. It has the same views: Schedule, Board, List, Calendar, Pipeline, Agents, Costs, History and Decisions, plus the floating composer. A scope menu in the top bar picks **All projects**, one organization, or one project.

- Each repo stays its own source of truth.
- An adapter turns each repo into a versioned snapshot ([CONTRACT.md](CONTRACT.md)).
- The hub directory indexes orgs and projects.
- The page rolls the snapshots up when it renders, and writes its records back to each project separately.

## Files

| File | Does |
|---|---|
| `contract/snapshot.schema.json`, `contract/contract.mjs` | The snapshot contract, with a validator that reads the schema |
| `adapters/kosmos.mjs` | Runs a kosmos-style repo's `tools/pm/refresh.mjs` and normalizes it |
| `adapters/github.mjs` | Reads any GitHub repo's issues, PRs and milestones with `gh`, and its commits with `git log` |
| `adapters/usage.mjs` | Claude Code spend for any repo, through kosmos-engine's `tools/pm/usage.mjs` and `calendar.mjs` |
| `hub/hub.mjs`, `hub-sync.mjs` | The hub directory, and the command that refreshes every project in it |
| `rollup.js` | Turns the snapshots in scope into the page's collections. Several projects are summed, and their ids get the project's key as a prefix |
| `hub-db.js` | The page's `db` and `hub` APIs, over the hub's files |
| `hub-router.js` | The composer's first step: which project a prompt is about |
| `page.html` | The page: `kosmos-gantt.html` with the scope menu, per-project links and the composer's project step |
| `entry.js`, `build.mjs` | The Canvas entry and the build that writes `dist/` (gitignored) |
| `apply.mjs` | Writes a project's page records back to that repo |

## Hub data

The hub lives in `~/.openhands/pm-hub/` on the Agent Server's machine:

```text
~/.openhands/pm-hub/
  hub.json                              orgs and projects
  hub-sync.mjs                          launcher for this app's hub-sync.mjs
  projects/<org>/<repo>/snapshot.json   the adapter's output (CONTRACT.md); never hand-edited
  projects/<org>/<repo>/local.json      what the page recorded for that project
```

`hub.json`:

```json
{
  "schema": "pm-hub.hub", "version": 1,
  "tools": { "pm": "/…/kosmos-engine-proto/tools/pm" },
  "orgs": [{ "id": "Modern-Telepathy", "name": "Modern-Telepathy" }],
  "projects": [{
    "id": "Modern-Telepathy/yakopop", "org": "Modern-Telepathy", "repo": "yakopop", "name": "yakopop",
    "path": "/…/yakopop", "url": "https://github.com/Modern-Telepathy/yakopop",
    "adapter": "github", "usage": true,
    "lastSync": { "at": "2026-10-24T05:45:40Z", "ok": true, "ms": 36000, "cards": 5, "sources": ["github", "usage"] }
  }]
}
```

- `adapter` is `kosmos` or `github`.
- `usage` lays Claude Code spend over the project's snapshot. `tools.pm` names the kosmos-engine `tools/pm` folder the usage adapter reuses.
- `branch` (optional) is the branch to count commits on. The default is `origin/HEAD`.
- `labels` (optional) replaces the GitHub label lists in [CONTRACT.md](CONTRACT.md).

`local.json` uses the same shape as the kosmos-roadmap app: `{ "collections": { name: { id: data } } }`, where `null` deletes a document. Page writes go there: board moves (`cardstate`), `decisions`, `inbox`, `proposals`, `rows`, `actions` and `prices`. A sync never touches it.

## Use

```bash
cd examples/canvas-apps/projects-hub
node hub-sync.mjs add ~/code/kosmos-engine-proto   # has tools/pm/refresh.mjs, so the kosmos adapter
node hub-sync.mjs add ~/code/yakopop               # any other repo uses the github adapter, plus usage
node hub-sync.mjs                                  # refresh every project; or node ~/.openhands/pm-hub/hub-sync.mjs
node build.mjs
```

`add` reads the org and repo from the `origin` remote. `--adapter`, `--org`, `--repo`, `--name`, `--branch` and `--usage`/`--no-usage` override it. `hub-sync.mjs list` shows each project's last sync. `--only <org/repo>` refreshes some projects. `--offline` skips `gh`. A snapshot that breaks the contract is not written: the old one stays, and `lastSync` records the error.

To install, open **Customize > Apps > Add app** and enter the absolute path of `dist/`. Enable the app. **Projects** appears in the sidebar at `/extensions/projects-hub/projects`. After a rebuild, choose **Update** on the app's card. `build.mjs --data-dir <dir>` and `hub-sync.mjs --hub <dir>` move the hub; use the same directory for both.

## Scope and rollups

- **One project.** The page shows that project's ids as they are, so a kosmos scope looks like the Kosmos Roadmap.
- **Several projects.** Card ids read `<key>:<id>` (`yakopop:GH.12`), tracks read `<key>/<track>`, and Schedule rows and lanes get a `<key> · ` label. The key is the repo name, or `org.repo` when two orgs share a repo name. The board header, costs (`meta/costs`), calendar days, history days and the history metrics are summed. Prices come from the first project. The Costs view's "path to completion" (`meta/estimates`) shows only when exactly one project in scope has it.
- **Writes.** A write goes to the `local.json` of the project its document belongs to, found from the id's key or the document's `project` field, with the keys stripped again. A new row has no project yet, so with several projects in scope, adding one asks you to pick a project first.

## Composer

The composer routes in two steps. First [`hub-router.js`](hub-router.js) picks the project. It looks, in order, for:

1. a project named in the prompt: its id, repo, name, checkout path or `<key>:` card reference, or the first word of a repo name that only one project has (`kosmos`);
2. a card id that only one project in scope has;
3. the scope, when it holds one project;
4. the open card's project;
5. the project whose cards share the most words with the prompt.

Then kosmos-engine's `router.mjs` (embedded in the page, unchanged) picks the card, role and model within that project's cards. `#12` in a prompt means `GH.12` or `PR.12` in a GitHub project.

The route preview shows the project and lets you change it. With several projects in scope and none picked, the confirm button stays disabled. Confirmed routes record `project` on their `inbox`, `decisions` and `proposals` documents.

**Start agent** opens a conversation on the local Agent Server in the project's checkout: `workspace.working_dir` is the project path. It is tagged `pm_project`, `pm_card` and `pm_role`. A GitHub card's brief tells the agent to read the issue with `gh issue view`.

## Applying records

```bash
node apply.mjs Modern-Telepathy/kosmos-engine          # dry run
node apply.mjs all --write --clear
```

- **kosmos projects.** `apply.mjs` passes `local.json` to the repo's own `tools/pm/apply.mjs`, which updates `tasks/*.jsonl`.
- **GitHub projects.** Board moves become label edits: the first label of the new status, with the old status labels removed. A move to Done closes the issue. Decisions and composer notes become comments, and proposals become new issues.
- **`--clear`.** Marks what was applied in `local.json`, the way kosmos-engine's apply does.

## Tests

```bash
npx vitest run examples/canvas-apps/projects-hub
```

The tests cover the contract and its validator, each adapter (fixtures, plus kosmos-engine's real `usage.mjs` when a checkout is next to this repo or `PM_TOOLS` points at one), rollups across projects and orgs, the store's scoped reads and per-project writes, the project router, the `gh` plan in `apply.mjs`, and `hub-sync.mjs`.

## Not yet done

- **Ask Claude** is hidden, as in the kosmos-roadmap app. Canvas gives extensions no LLM call.
- The Pipeline view's stage texts, and its release gap of 53 commits, are still kosmos-engine's.
- **Start agent** has not been run end to end from this app. It would start a real agent; the request shape matches what Canvas sends.
