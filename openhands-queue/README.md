# OpenHands Issue Queue (Canvas Extension)

A Canvas Extension (called an **App** in the UI) that adds an issue queue page to Agent Canvas. Queue issues to specific projects and agents, and see the full issue queue.

## Files

- `canvas-extension.json`: manifest (`schema_version: 1`), contributes one page at `/queue`.
- `extension.js`: dependency-free ESM entrypoint. Its `activate(host)` registers the `queue` page.

## Install

Agent Canvas installs extensions from the active Agent Server, so the source must be reachable from that server. Then:

1. Open **Customize > Apps** (`/apps`) and choose **Add app**.
2. Install from this folder's source, or from a repo path that contains it.
3. Review the trust disclosure and **enable** the app. Installing alone leaves it disabled.

Extension code is trusted and runs in the Canvas page with the same browser authority as Canvas itself.

## Behaviour

- **Queue an issue**: pick a project and an agent, add a title, optional issue URL and details, and a priority.
- **Projects / Agents**: add or remove the ones you can queue to. Removing one also removes its queued items.
- **Full issue queue**: every item, filterable by project, agent and status.
- **Item actions**: Start, Done, Failed, Requeue, raise or lower priority, Remove.

Queued items sort by status (queued first), then priority (high → low), then age.

## Storage

The queue is kept in `localStorage` under `openhands-queue:v1:<backend id>`, so each Agent Server has its own queue. It is per browser and does not sync.

## Not yet done

- No dispatch to agents. Starting an item only changes its local status. Real dispatch needs endpoints in the software-agent-sdk repo, reached through `host.agentServer.request`.
- Not yet tested in a running Agent Canvas.
