# Squash of PR #16695: Polish discovery CTAs and mention create in empty-state copy

PR: https://github.com/OpenHands/OpenHands/pull/16695

Screenshots from the PR: `.pr/automation-discovery-cta/add-automation-discovery-cta.png`
and `.pr/automation-discovery-cta/templates-discovery-cta.png`.

## Problem

Type: UI polish plus a small discovery feature. Users landing on an empty
Automations page, the Templates page, or the header Add menu had no clear way
to ask OpenHands to find automation opportunities, and the empty-state copy
only mentioned creating one. The PR folds the header actions into one Add menu
with a "Find opportunities" entry, shows both example prompts in the
empty-state copy, adds a discovery banner on the Templates page, and launches a
seeded conversation (with a "Creating conversation" modal) for discovery.

## Resolution against the proto architecture

Proto already routes "create automation" to the setup form
(`useStartAutomationSetup`), has permission gating, git sync, and the editor
hook. Those win. The PR's discovery conversation flow is ported on top.

| File | Decision |
|---|---|
| `add-automation-menu.tsx` (add/add) | Kept proto menu. Added the PR's "Find opportunities" item (`onSuggest`, Sparkles icon) and the Plus icon on the trigger. The create item keeps proto's label and `onAdd`. |
| `create-instructions.tsx` | Kept proto `startSetup` primary button. Added the PR's secondary "Find opportunities" button and launch modal. Dropped the PR's "add known automation" conversation button: the setup form supersedes it. |
| `empty-state.tsx` | Proto wins (theme token `text-contrast`); PR change was an older color. |
| `automations-list.tsx` | Kept proto (editor hook, setup, drafts, import modal state, git sync). Wired `onSuggest` to the launch modal. Dropped the PR's `EditAutomationModal` and file-input import (superseded by `ImportAutomationModal` and `openEditor`). The launch modal mounts only while a request is active, so tests without a QueryClient keep working. |
| `automation-templates.tsx` | Took the PR's discovery banner; "Find opportunities" launches the conversation, the secondary button opens the setup form (`startSetup`) instead of the PR's add-conversation. Search stays full width as in proto. |
| `translation.json` | Merged. New key `AUTOMATIONS$FIND_OPPORTUNITIES_BUTTON`; `AUTOMATIONS$CREATE_AUTOMATION_BUTTON` stays "Create Automation" because the setup panel still uses it (the PR repurposed it to "Find opportunities"). Took the PR's new copy for the empty hint, how-to title, conversation description, guidance, discovery prompt, and templates CTA. Added Indonesian (`id`, a proto locale) for all changed keys. Removed now-unused keys: `ADD_AUTOMATION_PROMPT`, `DISCOVERY_OPTION_TITLE`, `CUSTOM_OPTION_TITLE`, `CUSTOM_OPTION_DESC`, `CUSTOM_AUTOMATION_BUTTON`, `CUSTOM_AUTOMATION_PROMPT`. |
| `use-tracking.ts` | `trackAutomationCreatedButton` `intent` and `source` are optional so the proto setup flow (backend kind only) still type-checks; intent narrowed to `find_opportunities`. |
| `use-launch-automation-conversation.ts`, `automation-conversation-launch-modal.tsx` | Ported from the PR (clean adds; their dependencies exist in proto). `add_automation` intent removed. |
| `create-instructions.test.tsx` | Rewritten: create opens setup form, find-opportunities seeds a conversation, tracking, launch modal. |
| `automations-dashboard.test.tsx` | Kept proto tests; Add-menu test now expects the create item first and the find item to launch the conversation; "add" cases assert navigation to `/automations/setup`. |

Removed by the PR and left removed: `add-automation-modal.tsx` and its test
(proto already has no such file).

## Verification

- `npm run make-i18n` and `node scripts/check-translation-completeness.cjs`: pass.
- `npm run typecheck`: pass. `npm run lint`: 0 errors (626 existing warnings), prettier clean.
- vitest on `__tests__/components/automations`, `__tests__/routes`, `__tests__/hooks`: 2021 pass, 1 fail.
  The failure is `run-phase.test.tsx` (formats 1970-01-01 in a negative-UTC timezone), a file and code path this change does not touch.
- Full `npm run build` not run.
