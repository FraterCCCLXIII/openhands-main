# Squash port of PR #16305: agent notifications polish and ingest on finished

Source: OpenHands/OpenHands#16305 (branch `archive/openhands-pr-16305`).

**Flag:** this PR was labeled do-not-merge / POC upstream. The user decided to
merge it anyway; treat the feature as experimental.

## What it does

- Agents can emit a notifications block in a finished message. A parser strips
  it from the rendered text, and notifications are stored per conversation
  (storage, pending prompts, Zustand store).
- On finished runs, `useIngestAgentNotificationsFromEvents` collects
  notifications from the event stream; `detectAgentNotificationsFromEvents`
  also detects reusable skills/workflows heuristically (manual "Scan
  conversation" button).
- UI: a recommendation panel above the composer (create all, dismiss, remove),
  a notifications bell in the conversation header, and an unwired sidebar
  onboarding agent-notifications modal.
- `VITE_STAGE_AGENT_NOTIFICATIONS` injects demo recommendations.

## Ported

- All new notification modules, hooks, store, bell, detect button, modal, tests.
- Wiring in `chat-interface.tsx`, `interactive-chat-box.tsx`,
  `user-assistant-event-message.tsx` (strip block from displayed text; kept the
  newer reasoning handling) and `conversation-name.tsx`.
- `horizontalAlign` option for `usePopoverFixedPlacement` (the bell uses it),
  `formControlButtonCompactClassName`, new `CHAT_INTERFACE$AGENT_NOTIFICATIONS_*`
  i18n keys (incl. `id`), `.env.sample` entry.

## Dropped

- Context-window meter/ring, `format-token-count`, sidebar onboarding checklist
  storage/constants, say-hello recommended automations, app-settings checklist
  switch, translation-check script, `.gitignore`: the integration branch has
  newer versions of these.
- `scheduled-tasks-intro.constants.ts` (only used by the dropped checklist
  constants), `.pr/agent-notifications-demo` media.
- Translation keys already present on the branch (AUTOMATE$*, SIDEBAR$ONBOARDING_*).
