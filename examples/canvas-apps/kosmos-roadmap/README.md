# Kosmos Roadmap (Canvas App)

The Kosmos Roadmap page from kosmos-engine, packaged as a Canvas Extension.
The UI calls these **Apps**. It runs the same page as the claude.ai artifact
(<https://claude.ai/artifact/N1rHAzWCzM3nqWfvpYRP7S>) and reads the same
documents, which kosmos-engine's `tools/pm/refresh.mjs` generates.

## Files

- `kosmos-gantt.html`: the page, unchanged from the artifact. It has the
  graphite theme and seven views: Schedule, Board, List, Pipeline, Agents,
  History and Decisions.
- `roadmap-db.js`: stands in for the artifact runtime's `db` API
  (`collection(name).onSnapshot`, `collection(name).doc(id).set/update/delete`).
- `entry.js`: the `activate(host)` entry. It registers the `/roadmap` page,
  loads the page into a same-origin `srcdoc` iframe, and passes it a
  `window.claude` shim.
- `build.mjs`: writes the installable package to `dist/`, which is gitignored.
  The package holds `canvas-extension.json`, a self-contained `extension.js`
  and `icon.svg`.
- `sync.mjs`: packs a `refresh.mjs` run into `snapshot.json`.

## Data

Both files live in one data directory on the Agent Server's machine. The
default is `~/.openhands/kosmos-roadmap`. The page reads and writes them
through the Agent Server's file API (`/api/file/download` and
`/api/file/upload`), using `host.agentServer.request`.

| File | Written by | Holds |
|---|---|---|
| `snapshot.json` | `sync.mjs` | Every document from `refresh.mjs`, as `{ collections: { name: { id: data } } }` |
| `local.json` | the page | Board moves (`cardstate`), decisions, ticked actions, and row edits, in the same shape. `null` deletes a document. |

The page lays `local.json` over `snapshot.json`. A sync never changes
`local.json`. The page polls both files every 30 seconds, so a sync shows up
without a reinstall.

## Use

```bash
cd examples/canvas-apps/kosmos-roadmap
node build.mjs
node sync.mjs --engine /path/to/kosmos-engine
```

`sync.mjs --engine` runs `node tools/pm/refresh.mjs --out <tmp>` in that
checkout and then packs the result. You can pack an existing run with
`--from <refresh --out dir>` instead. Pass `--offline` to skip the `gh` calls.

To install, open **Customize > Apps**, choose **Add app**, and enter the
absolute path of `dist/` as the source. Then enable the app. **Kosmos Roadmap**
appears in the sidebar at `/extensions/kosmos-roadmap/roadmap`. After a
rebuild, choose **Update** on the app's card.

`build.mjs --data-dir <dir>` and `sync.mjs --data-dir <dir>` change the data
directory. Both commands must use the same directory.

## Not yet done

- **Ask Claude** is hidden. The page uses the artifact runtime's `sample`
  call, and Canvas does not give extensions an LLM call to put behind it.
- **Connect an agent** still shows the claude.ai artifact instructions. Agents
  that follow them update the artifact, not `local.json`.
- Nothing applies `local.json` back to kosmos-engine. Agents that apply
  overrides read them from the artifact today.
- Like every Canvas App, this needs a local Agent Server. Apps are not
  available on Cloud backends.
