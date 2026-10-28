# What an agent turn generates: events, metadata and streaming

Analysis of what the Agent Server sends this frontend per agent turn, what the
feed already uses, and what it could surface next. Read from the code; items
that could not be confirmed there are marked **unverified**. Paths are relative
to the repo root.

## Streamed event kinds

The event union is in `src/types/agent-server/core/openhands-event.ts`, with
guards in `src/types/agent-server/type-guards.ts`. Every event has an `id`, a
`timestamp` and a `source` (agent, user, environment or hook).

| Event | Key fields | Meaning |
|---|---|---|
| MessageEvent | `llm_message` (role, content, `reasoning_content`, `thinking_blocks`), `activated_skills`, `critic_result` | A user or agent chat message |
| ActionEvent | `thought`, `reasoning_content`, `action`, `tool_name`, `tool_call_id`, `llm_response_id`, `security_risk`, `critic_result`, `summary` | The agent chose a tool call. `summary` is an LLM-written one-line label |
| ObservationEvent | `tool_name`, `action_id`, `observation` (many kinds: terminal, file edit, browser, MCP, task tracker, grep, skill, subagent task, LLM switch) | The tool result |
| UserRejectObservation | `rejection_reason`, `action_id` | An action was rejected or blocked by a hook |
| AgentErrorEvent | `error`, `classification` (kind, `retryable`, `user_action`) | An LLM or tool error |
| ConversationErrorEvent, ServerErrorEvent | `code`, `detail` | Fatal or server-side error banners |
| ConversationStateUpdateEvent | `key` + `value`: `full_state`, `execution_status`, `stats`, `goal` | State changes |
| SystemPromptEvent | `system_prompt`, `tools`, `dynamic_context` | Start of a conversation |
| Condensation events | `forgotten_event_ids`, `summary` | History compaction |
| PauseEvent | | The user paused |
| HookExecutionEvent | hook type, `blocked`, `exit_code`, `reason` | A hook ran |
| ACPToolCallEvent | `title`, `status`, `tool_kind`, `raw_input`, `raw_output` | Tool calls made by ACP agents (Claude Code, Codex, Gemini CLI). Two events per call |
| StreamingDeltaEvent | `content`, `reasoning_content`, `attempt` | A **client-made** provisional slot, never stored by the server |

`goal` state carries `status`, `iteration`, `max_iterations`, `objective` and a
`verdict` (score 0–1, `complete`, `missing`). Goal verdicts are only observable
through this state update.

Subagent delegation appears as a `TaskAction` (prompt, `subagent_type`,
`description`) and a `TaskObservation` (`status`, `is_error`).

**Unverified:** `ConfirmationRequestEvent` exists only in the typescript-client
types and no guard here uses it. Approvals are inferred from
`execution_status = waiting_for_confirmation` (`src/utils/feed-notifications.ts`).
`LLMCompletionLogEvent` and `TokenEvent` also exist in the client library and
are not handled; whether the server emits them over the socket is unconfirmed.

## Conversation metadata, by source

- **List and detail** (same shape, `DirectConversationInfo`): id, title,
  timestamps, `execution_status`, `sandbox_status`, `metrics` (cost, budget,
  token usage with cache read and write), raw `stats`, `agent`,
  `current_model_*`, `available_models`, `workspace`, `tags`,
  `launched_agent_profile`, `sub_conversation_ids`.
- **`AppConversation` drops the raw `stats`.** It keeps only the combined
  `metrics`. Per-call arrays are only on the runtime detail call
  (`getRuntimeConversation`) or in stats events.
- **Client-side only (localStorage, not the server):** `selected_repository`,
  `selected_branch`, `git_provider`, `active_profile`. For local backends
  `trigger`, `pr_number` and `created_by_user_id` are hard-coded.
- **Live stream:** `execution_status`, `stats`, `goal`, `full_state` only.
- **Event history:** `GET events/search`, max 100 per page, `page_id` cursor,
  oldest or newest first, timestamp filters.

## Per-LLM-call metrics

`stats.usage_to_metrics` is keyed by an LLM usage id (`default`, `condenser`,
`profile:<name>:<uuid>`). Each entry has `model_name`, `accumulated_cost`,
`max_budget_per_task`, `accumulated_token_usage`, and three arrays:
`costs[]` (model, cost, timestamp), `response_latencies[]` (model, latency,
`response_id`) and `token_usages[]` (model, prompt, completion, cache read and
write, `reasoning_tokens`, context window, `per_turn_token`, `response_id`).

- `response_id` on token usages and latencies appears to match
  `ActionEvent.llm_response_id`. That is an inference from the names; nothing
  in the code joins them yet.
- The app's own `TokenUsage` type and `combineUsageMetrics` drop
  `reasoning_tokens`, the per-call model and `response_id`, and discard the
  arrays. Usage Insights reads `reasoning_tokens`; the frontend aggregate does
  not.
- There is no explicit per-turn event. Stats snapshots are persisted, so the
  difference between two snapshots gives per-turn cost and tokens after the
  fact (this is how Usage Insights works).

## Streaming mechanics

- One WebSocket per open conversation at `/sockets/session/{id}`, resumable
  with `?after_seq=<n>`. Frames: `sync`, `durable` (with a sequence number),
  `transient`, `item_started`, `delta` (text or reasoning tokens),
  `item_aborted`, `error`.
- Deltas stream live but are **not replayed** after a reconnect. Reasoning and
  partial text are live-only; afterwards only the final `reasoning_content` and
  `thinking_blocks` on the stored event remain.
- Stats arrive as `ConversationStateUpdateEvent` and are combined into one
  total in the websocket context.
- **The feed does not use the socket.** It polls the REST event history every
  8 seconds while a conversation is running.

## What the feed uses today

- Message text (280 characters), the **tool name only** of each action, and
  conversation errors, capped at 6 updates (`src/utils/feed-updates.ts`).
- The full history on demand (`use-feed-conversation.ts`, up to 2,000 events).
- Tokens, cache tokens, server-reported cost, budget and context percentage.
- Execution status mapped to a notification kind, subagent count and tree, and
  git diff stats.

**Generated but unused:** `ActionEvent.summary`, `thought`, reasoning content,
`security_risk`, `critic_result`, `activated_skills`; every observation result
(`is_error`, exit codes); rejections; agent-error classification; condensation;
hook runs; ACP tool calls; goal status; latencies, per-call costs and token
usages; `reasoning_tokens`; `tags` and `launched_agent_profile`.

## Candidate expansions, by value for the feed

1. **Action summary line.** Show `ActionEvent.summary` instead of a bare tool
   name. Optional, so fall back to `tool_name`. ACP tools use the `title`.
2. **Approvals waiting.** Pair `waiting_for_confirmation` with the pending
   action and its `security_risk` badge, and offer approve and deny. There is
   no pending-action event, so find the latest action without an observation.
3. **Errors with meaning.** Use `AgentErrorEvent.classification` (kind,
   retryable, what the user should do). Both agent and server errors are
   ignored today.
4. **Goal progress.** Iteration over max, verdict score and what is missing.
   Only available from persisted state events or live, not in list metadata.
5. **Subagent activity.** `TaskAction.description` and `TaskObservation.status`
   say what each subagent did, not just how many exist.
6. **Reasoning snippet.** `thought` and `reasoning_content` on actions. Live
   token-by-token reasoning needs the socket; polling only sees the final text,
   and it can be redacted.
7. **Tool outcome.** `is_error` and exit codes on observations, plus rejected
   actions.
8. **Per-turn cost, latency and model.** Diff stats snapshots, or read the
   runtime detail's `costs[]`, `response_latencies[]` and `token_usages[]`.
   Needs `reasoning_tokens` added to the app types, and the raw `stats` kept on
   `AppConversation`.
9. **Critic score**, when a critic is configured.
10. **Skill, hook and condensation badges** (low value).
11. **Tags and launched profile** (already on the list, no extra fetch).

## Upgrade path

Polling is enough for items 1, 3, 5, 7 and 8. Live reasoning (6), goal updates
(4) and instant approvals (2) are better served by the session socket with
`after_seq`, which means a socket per visible card. The current websocket
provider is per open conversation only, so that is new work. Any new server
field belongs in `software-agent-sdk`, not here (`AGENTS.md`).
