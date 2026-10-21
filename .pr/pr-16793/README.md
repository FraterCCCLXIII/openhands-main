# PR #16793 squash port

Source: `archive/openhands-pr-16793` ("fix: keep mock-LLM profile deletion from
clicking a leftover menu", plus a conversation-chrome polish commit).

## What the PR does
- Polishes the conversation header chrome: git actions, overview, and drawer
  toggles share one 28px aligned row; the pin icon is a shared component.
- Makes the overview panel a click-only dropdown on mobile.
- Removes the empty-state "Connect Repo" chip from the git control bar.
- Hardens the mock-LLM e2e profile helpers so a leftover portaled profile menu
  can no longer make the delete step click the wrong profile.

## Ported
- Header actions row classes, `ChatActionTooltip` inline-flex wrapper, and the
  slot wrapper on the right-panel, git-actions and overview toggles.
- `PinToggleIcon` (+ test), `dropdownMenuPinIconWrapperClassName`, `pill-fill.svg`.
- Mobile overview dropdown in `conversation-overview-toggle.tsx` (+ tests).
- Git control bar no longer shows an empty "Connect Repo" chip (+ tests).
- E2E helpers (`profileRowByName`, `closeProfileActionsMenu`, menu-scoped
  locators) and the reworked profile-deletion spec.
- New `COMMON$COMMIT` i18n key (with an added `id` translation, required by the
  completeness check).

## Dropped (superseded by the newer integration architecture)
- Overlay/inline overview layout mode (`use-conversation-overview-layout-mode`,
  `getConversationOverviewLayoutMode`, thread padding shift, 800px thread cap in
  the wrapper): the integration branch spans the thread full-pane, caps the
  reading column inside the chat, and keeps the column-space hook.
- The `interactive-chat-box.tsx` change: the git control bar now lives in the
  composer with `showGitControlBar`; the PR's removal does not apply.
- The PR's `chat-interface-wrapper` test changes and constants test, which
  covered the dropped layout mode.
