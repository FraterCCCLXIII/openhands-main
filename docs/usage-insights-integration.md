# Usage Insights: what it mines and how it connects to the feed and Projects Hub

Status: analysis plus a first slice. The first slice (feed cost accuracy) is
built; the rest is a proposal.

The extension lives at `examples/canvas-apps/usage-insights/`, copied from
`OpenHands/canvas-apps`. It is a dependency-free Canvas App that adds a routed
**Usage** page at `/extensions/usage-insights/usage`.

## What it mines

All through `host.agentServer.request()`, so it only runs against a local
Agent Server (Canvas Apps are not available on Cloud backends yet).

| Source | Endpoint | Fields used |
|---|---|---|
| Conversation list | `GET /api/conversations/search` (paged, max 500) | `stats.usage_to_metrics`, title, status, created/updated, `current_model_id` |
| Event history | `GET /api/conversations/{id}/events/search` (paged, max 2,000 each) | `ConversationStateUpdateEvent` with `key: "stats"` or `"full_state"` |
| Profiles | `GET /api/profiles` | name and model only (never the per-profile or provider-connection endpoints, which can hold credentials) |

From each `usage_to_metrics` entry (keyed by LLM usage id, such as `default`,
`condenser` or a profile id) it reads: model name, accumulated cost, max
budget per task, and prompt, completion, cache-read, cache-write and reasoning
tokens, plus context window and per-turn tokens.

## What it derives

- **Deltas over time.** Stats snapshots are cumulative, so it sorts them and
  subtracts the previous snapshot per conversation, usage key and model. This
  is what makes time buckets (day, week, month) and per-turn progression
  possible.
- **Cost provenance.** Each delta is `reported` (the server's accumulated cost
  delta, never altered), `catalog` (priced from a bundled public price catalog
  by exact provider and model) or `unpriced` (tokens shown, no money). Mixed
  periods are labelled `mixed`. Reasoning tokens count as completion tokens to
  avoid double counting.
- **Breakdowns** by time, model and conversation, **budget progress** with
  over-budget warnings, a read-only **pricing coverage** view, and a
  browser-local IndexedDB cache scoped per backend (90-day retention).
- **Polling**: active conversations refresh every 10 seconds, because host API
  1 has no WebSocket helper.

## What we already have

| Where | Data | Source |
|---|---|---|
| Feed card stats | tokens, context %, cost, budget (new), diff, subagents | `AppConversation.metrics` plus the conversation metrics query |
| Canvas core | combined per-conversation metrics | `src/utils/conversation-metrics.ts` (`combineUsageMetrics`) |
| Projects Hub `adapters/usage.mjs` | Claude Code usage per repo, priced with kosmos-engine's `prices.json` | local `~/.claude/projects` transcripts, not the Agent Server |
| Projects Hub `adapters/github.mjs`, `kosmos.mjs`, `sdlc-workflow.mjs` | PRs, cards, workflow | GitHub and kosmos-engine |

The key point: **the Hub's usage covers Claude Code; Usage Insights covers
OpenHands conversations.** They are different populations of work, so they
add up rather than overlap. Neither covers the other.

## Built now: feed cost accuracy

The feed card now follows Usage Insights' accuracy rules using only fields it
already receives:

- Cost is shown only when the server reported one (`reported`).
- Tokens with no reported cost show **Unpriced** instead of nothing. Before,
  an unpriced conversation looked free.
- A per-task budget shows a progress bar and turns red when exceeded.
- The token count has a tooltip with prompt, completion, cache-read and
  cache-write totals.

See `toFeedUsage` in `src/utils/feed-usage.ts` and `feed-stats.tsx`.

## Proposed connections

1. **Hub adapter for OpenHands usage** (`projects-hub/adapters/openhands.mjs`).
   Read conversations from the Agent Server, group by `selected_repository`,
   and fill the contract's `costs` and `calendar` collections with the same
   delta and provenance rules. Label the source `openhands` so Claude Code and
   OpenHands usage show side by side per project. This is the highest-value
   link: it gives each project in the Hub a complete cost picture.
2. **Feed project and factory rows** use real numbers. The left-list diff
   figures are simulated today; the Hub's per-project data (diff, PRs, cost) is
   the real source and could replace them.
3. **Per-model detail in the feed.** The list carries only aggregated metrics.
   Per-model costs need `stats.usage_to_metrics`, which the extension reads
   from the list response and Canvas currently drops. Surfacing it on
   `AppConversation` would allow a models chip and a per-model tooltip.
4. **One pricing catalog.** The extension bundles a small catalog and the Hub
   uses kosmos-engine's `prices.json`. Pick one owner, or drop catalog
   estimates in Canvas and show only reported cost, as the feed does now.

## Constraints

- Do not reimplement Agent Server contracts in Canvas (`AGENTS.md`). The
  extension and a Hub adapter read existing endpoints only. A new field on the
  list response would be an SDK change.
- Extensions are standalone bundles. Canvas core must not import from them. To
  share logic, copy the pure functions with a note, or publish them as a
  package. Do not reach into the extension's IndexedDB cache from the feed.
- Usage Insights keeps per-backend data in the browser. The Hub keeps its data
  under `~/.openhands/pm-hub`. A shared view needs one of them to be the
  owner.

## Showing it in the left nav

The nav entry comes from the extension's own manifest (`nav_label: "Usage"`),
so it appears when the app is installed and enabled on a **local** backend.
Install `examples/canvas-apps/usage-insights` from its absolute path under
Customize, then Apps.
