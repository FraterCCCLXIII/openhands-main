# PR #16973 - DigitalOcean provider mockup

**DO NOT MERGE / DRAFT.** Upstream PR: https://github.com/OpenHands/OpenHands/pull/16973
("feat(backends): DigitalOcean provider mockup [DO NOT MERGE]"). It is a UI mockup only.
It was squashed into this integration branch at the user's request to merge all PRs.

## User problem

The add-backend chooser had no way to connect through third-party cloud providers. The PR
mocked a "Providers" tab with a DigitalOcean card, a token step, and a fake droplet picker.
Screenshots of the mockup are kept here (`01-providers-catalog.png`,
`02-digitalocean-token.png`, `03-select-droplet.png`).

## Conflict decisions

| File | Decision |
|---|---|
| `src/components/features/backends/backend-form-modal.tsx` | Kept HEAD. HEAD already has a real Providers tab backed by `DigitalOceanConnectPanel` (MARS, see `src/api/mars/AGENTS.md`). |
| `__tests__/components/backends/add-backend-modal.test.tsx` | Kept HEAD (tests match the HEAD chooser). |
| `src/i18n/translation.json` (auto-merged) | Reverted to HEAD. HEAD already defines `BACKEND$PROVIDERS_TITLE`, `_OPTION_DESCRIPTION`, `_COMING_SOON`; merging would have duplicated keys. |

## Dropped items and reasons

- `third-party-provider-panel.tsx`, `third-party-backend-providers.ts`: mock provider list and fake
  droplet picker, superseded by the real MARS DigitalOcean flow. Nothing referenced them once the
  chooser conflict was resolved to HEAD (dead code).
- `src/icons/digitalocean.svg`: HEAD uses `#/assets/branding/digitalocean-logo.svg`.
- PR-only translation keys (`BACKEND$PROVIDERS_BACK`, `BACKEND$PROVIDER_DIGITALOCEAN_*`,
  `BACKEND$PROVIDER_DROPLET_STATUS_*`): only used by the dropped panel.
- Slide-over (`AddBackendSlide`) and tab `showDescription` UI: part of the mock, conflicts with HEAD's design.

Net effect: only the documentation screenshots land.

## Verification

- `npx tsc --noEmit`: clean.
- `npm run lint`: 0 errors (626 pre-existing warnings), Prettier clean.
- `vitest run __tests__/components/backends`: 12 files, 174 tests passed.
- No source files differ from HEAD, so no regressions can come from this merge.
