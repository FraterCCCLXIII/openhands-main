# Snapshot contract, version 1

A snapshot is what one adapter run says about one repository. Each repo stays its own source of truth: a snapshot is regenerated from the repo and never edited by hand. The schema is [`contract/snapshot.schema.json`](contract/snapshot.schema.json). `contract/contract.mjs` validates a snapshot against that file, and `hub-sync.mjs` refuses to write a snapshot that fails.

```json
{
  "schema": "pm-hub.snapshot",
  "version": 1,
  "project": { "id": "Modern-Telepathy/kosmos-engine", "org": "Modern-Telepathy", "repo": "kosmos-engine", "name": "kosmos-engine", "path": "/…/kosmos-engine-proto", "url": "https://github.com/…", "adapter": "kosmos" },
  "generatedAt": "2026-10-24T05:30:00.000Z",
  "sources": [{ "adapter": "kosmos", "at": "…", "documents": 1240, "note": "tools/pm/refresh.mjs" }],
  "collections": { "cards": {}, "runs": {}, "history": {}, "costs": {}, "calendar": {} }
}
```

## Namespacing

- The project id is `<org>/<repo>`, taken from the checkout's GitHub remote.
- Every document carries `project`, and it must equal `project.id`.
- A snapshot lives at `projects/<org>/<repo>/snapshot.json` in the hub directory, so two repos never share a file.
- The app gives each project a short key: its repo name, or `org.repo` when two orgs share a repo name. With several projects in scope, the page shows card ids as `<key>:<id>`, tracks as `<key>/<track>`, and document ids as `<key>_<id>`. A write strips the key again before it reaches that project's `local.json`.

## Statuses

Records with a state use one of six statuses. These are the Board's columns:

| Status | Means |
|---|---|
| `backlog` | Not started; dependencies are not done yet, or nobody has triaged it |
| `ready` | Can start now |
| `building` | Someone is working on it |
| `verify` | Waiting for review or verification, usually as an open PR |
| `blocked` | Waiting on a decision, a person or another item |
| `done` | Landed or closed. A pull request closed without merging is also `done`; it keeps `st: "C"` |

Adapters keep the repo's own word in `sourceStatus`.

## Collections

These five are required. Every adapter writes them, even if empty.

| Collection | Document | Required fields |
|---|---|---|
| `cards/<id>` | One piece of work | `id`, `title`, `status`. Optional: `track`, `tier` (1–4), `kind`, `size` (S, M, L), `deps`, `flags`, `labels`, `ask` (a question waiting on a person), `gate`, `plan`, `url` |
| `runs/<id>` | One attempt at a card, from claim to land | `card`, `status`. Optional: `claimed`, `landed`, `claimToLandH`, `pr`, `runtime`, `tokens`, … |
| `history/<id>` | `kind: "prs"` (`items`: `n`, `t`, `st` M/O/C, `status`, `o`, `e`, `h`, `add`, `del`, `card`, `url`), `kind: "issues"` (`items` with `status`), or `kind: "days"` (`items`: `d`, `commits`, `merges`, `reverts`, `prsOpened`, `prsMerged`) | `kind`, `items` |
| `costs/summary` | Measured model spend, in the shape of kosmos-engine's `meta/costs` (`total`, `calls`, `models`, `days`, `composition`, `ctx`, `profile`, `forecast`, …), plus `byStatus`: dollars by the status of the card they were spent on | `total`, `calls` |
| `costs/session-<id>` | One session's spend on the cards it claimed, with the `status` of those cards | |
| `calendar/<YYYY-MM>` | One month, a day per entry (`d`, `runs`, `subagents`, `calls`, `tokens`, `cost`, `hours[24]`, `models`, `items`, `sessions`, `landed`, `prsMerged`, `commits`), plus `events`: `{ ref, status }` for what changed state that day | `month`, `days` |

Adapters can add more collections that the page reads as they are: `rows` (Schedule bars), `lanes`, `jobs`, `actions`, `sessions`, `prices`, `cardstats` and `meta` (`board`, `history`, `capacity`, `estimates`).

## Adapters

| Adapter | Reads | Card ids |
|---|---|---|
| `kosmos` ([adapters/kosmos.mjs](adapters/kosmos.mjs)) | The repo's own `tools/pm/refresh.mjs` | The registry's (`RND.L2`) |
| `github` ([adapters/github.mjs](adapters/github.mjs)) | `gh issue list`, `gh pr list`, milestones and `git log` | `GH.<n>` for issues, `PR.<n>` for open PRs that close no issue |
| `usage` ([adapters/usage.mjs](adapters/usage.mjs)) | Claude Code transcripts, through kosmos-engine's `tools/pm/usage.mjs` and `calendar.mjs` | None. It adds `costs/summary`, calendar spend and `prices` |

When a project in `hub.json` has `usage: true`, the usage adapter's snapshot is laid over the repo adapter's. Its documents win, except calendar months, which are summed day by day.

### GitHub label mapping

A label sets an open issue's status. Labels are compared in lower case, and the first status in this order with a matching label wins:

| Status | Labels |
|---|---|
| `blocked` | `blocked`, `on hold`, `waiting`, `needs info`, `status: blocked` |
| `blocked`, with `ask` from the issue body | `needs decision`, `decision`, `question`, `needs discussion` |
| `verify` | `needs review`, `in review`, `review`, `ready for review` |
| `building` | `in progress`, `wip`, `doing`, `claimed` |
| `ready` | `ready-for-dev`, `ready for dev`, `ready`, `todo`, `accepted`, `approved` |
| `backlog` | `backlog`, `icebox`, `later`, `triage` |

An open issue with no status label is `verify` if an open PR closes it (`building` if that PR is a draft), `building` if someone is assigned, and `backlog` otherwise. A closed issue is `done`. `T1`–`T4` labels set the tier, `size: S/M/L` labels set the size, and `bug`, `documentation` and `enhancement` set the kind. The milestone is the track; with no milestone, the first other label is. A project's `labels` entry in `hub.json` replaces any of these lists.

## Changing the contract

Additive fields need no version change. Renaming or retyping a field, or adding a required one, raises `version`. Update the schema, `contract.mjs`, the adapters and `rollup.js` together.
