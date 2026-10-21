# Squash port of PR #16207 - scope composer state per conversation

## What the original PR did
"fix(conversation): scope execution status and composer state per conversation".
Popouts read process-wide singletons, so typing/confirmation state, attachments,
drafts and one-shot message commands from the primary route leaked into other
windows. The PR keyed execution status, composer state and the event store by
conversation id, and added the popout UI (host, chrome, overflow menu, status
dot, layout, popout store, render scope) on top (~86 files).

## What was ported
- `conversation-store`: the composer fields (`images`, `files`,
  `imagesMarkedUploadAsFile`, `pastedImageNames`, `loadingFiles`,
  `loadingImages`, `messageToSend`, `messageRestoreIfEmpty`,
  `submittedMessage`) moved into per-conversation buckets
  (`byConversation[id]`). Every composer action now takes the conversation id
  as its first argument; `clearComposer(id)` drops a bucket. `HOME_COMPOSER_KEY`
  is the bucket for the Home launcher (no conversation id).
- `useConversationComposer()` (new) resolves the bucket from the navigation
  scope (falls back to Home) and binds the actions; `getConversationComposer(id)`
  is the non-subscribing reader. `useScopedConversationId()` (new, small
  standalone file) resolves explicit id -> route id.
- Consumers moved to the hook: custom chat input, interactive chat box, uploaded
  files, attachment upload, input logic, submission, grip resize, chat
  interface, pending user messages, git/macros menus, Home launcher.
- Launchers that queue a prompt for a freshly created conversation
  (recommended automations, create-automation conversation, manifest setup)
  now target that conversation's id; "use skill" targets `HOME_COMPOSER_KEY`.
  This replaces HEAD's `MessageToSendTarget` ("conversation" | "home") flag,
  which only guarded the Home composer against a single global slot.
- Tests updated for the new API, plus a hook test (composer isolation across
  route changes, Home fallback) and store-level isolation tests.

## What was dropped, and why
- Execution-status scoping (`conversation-state-store`, `use-agent-state`,
  `use-app-title`): HEAD already has `executionStatusByConversation` and
  `useAgentState(conversationId?)`, so the PR hunks were superseded.
- Event-store bucketing (`use-event-store`, `use-conversation-events`, the
  consumers `use-filtered-events`, `use-load-older-events`, `use-task-list`,
  `use-skill-installs`, ...) and the websocket context/provider changes: they
  only matter when two conversations render concurrently (popouts), and
  conflict heavily with HEAD's streaming slots and `loadedConversationId`
  handling. Not worth the risk without popouts.
- All popout UI/state (`src/components/features/popout/*`, `popout-store`,
  `conversation-render-scope`, conversation-card "open in popout" menu items,
  `useActiveConversation` primary-scope gating, popout i18n, screenshots,
  popout tests): a separate feature, absent from this branch.
- `.gitignore` and `vite.config.ts` churn, tools-context-menu and
  skill-install-banner test churn: cosmetic or tied to the dropped event store.

## Follow-up
If popouts land later, event-store bucketing and the render-scope context can be
layered on top of these composer buckets.
