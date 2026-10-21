# PR #17692 - Align automation setup UI flow, persist draft tags

PR: https://github.com/OpenHands/OpenHands/pull/17692

## Base branch decision

The PR targets `openhands/automation-draft-management-testing`, which is not an
ancestor of this branch (37 commits not on HEAD). The PR head contains that
base's work as well, so it was squashed in one go from `refs/pr/17692`
(option b). The squash therefore stands in for the base branch's commits:

- Base work (draft management UI #17688, BE-persisted drafts, setup split
  panel, agent-assisted form updates, cloud setup, draft tags in
  conversation tags, home Code/Automate toggle), about 38 commits from
  `8d3522424e` to `0eb2ec0f6c`.
- PR-own work: about 14 commits of control restyling (interview-style prompt
  stack, header, Trigger/Frequency, repo menu), cloud setup mode, saved drafts
  in the shared activity list, `Persist automation draft tags reliably` and
  `Show automation setup tag draft value`.

## User problem

UI polish plus reliability: restore the original interview styling on the setup
page and stop draft tags from being lost when several tag updates race. No new
user-facing capability beyond a repository picker menu (dropped, see below).

## Outcome

HEAD already contains an equivalent or newer implementation of everything the
PR's non-restyling commits add, so every conflict resolved to HEAD and the net
code change is empty. Verified equivalent on HEAD: the serialized tag-update
queue and latest-tags ref in the setup panel (`updateConversationTags`),
`getConversationTagValueLabel` and the draft facet label, cloud setup tags and
client tools in `createConversation`, the saved-draft group in
`automations-list.tsx`, SDK `HttpError` handling (`getResponseStatus` in
`automation-setup-draft-service.ts`), `use-prompt-textarea-resize`,
`composer-docked-context`, `automation-setup-plugins`.

## Conflicts (39 files)

| Files | Decision |
| --- | --- |
| `automation-setup-panel.tsx`, `automation-setup-prompt-stack.tsx` (+ tests) | HEAD. PR panel is the older monolithic design; HEAD uses the draft service and editor hook. |
| `home-chat-launcher.tsx`, `home-launcher-mode-toggle.tsx` (+ tests) | HEAD. PR changes active label to `text-white`, which regresses the theme-safe `text-contrast` (HL-001). |
| `automations-list.tsx`, `use-automations.ts`, `automation-service.api.ts`, `types/automation.ts`, mocks, dashboard/list tests | HEAD (draft group and API already present). |
| `automation-form.ts`, `automation-draft-tags.ts` (add/add) | HEAD. |
| `conversation-main.tsx`, `chat-interface.tsx`, `interactive-chat-box.tsx`, websocket context, `use-create-conversation.ts`, agent-server adapter and types | HEAD. |
| `translation.json`, `create-instructions.tsx` + test | HEAD (no new keys needed). |
| `add-automation-modal.test.tsx` (deleted on HEAD) | Kept deleted. |
| Clean-merged PR-only files: `automation-setup-draft-store.ts`, `use-task-polling.ts`, `git-provider-items-service.ts` | Reverted; they only serve the PR's draft store. |

## Dropped

- Repository picker menu and `GitProviderItemsService.listUserRepositories`
  (gh CLI fallback): needs a rewrite of HEAD's setup panel repository field;
  the text field with multi-repo parsing remains.
- `automation-setup-draft-store.ts` (local draft store): replaced by server
  drafts and the draft service.
- Restyled panel/header/composer: superseded by HEAD's setup flow.

## Verification

- `npx tsc --noEmit`: clean.
- `npm run lint`: 0 errors, 626 warnings (pre-existing).
- vitest on `__tests__/components/automations`, `__tests__/routes`,
  `__tests__/hooks`: 2021 passed, 1 failed. The failure is
  `run-phase.test.tsx` (formatRunPhaseAge negative timestamp), locale-dependent
  ("31 déc. 1969" vs /1970/) in an untouched file.
