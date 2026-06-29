# Local UX review mode

These files are gitignored and marked `skip-worktree` so they stay on your machine only.

## Start

```bash
npm run dev:ux-review
```

Or manually:

```bash
NEXT_PUBLIC_UX_REVIEW_MODE=true DISABLE_AUTH=true npm run dev
```

## Restore after a fresh clone

Copy everything from this backup folder back into the repo root paths:

- `fetch-json.ts` → `src/lib/fetch-json.ts`
- `providers.tsx` → `src/components/providers.tsx`
- `package.json` → `package.json` (merge the `dev:ux-review` script)
- `ux-review/` → `src/fixtures/ux-review/`
- `ux-review-mode.ts` → `src/lib/ux-review-mode.ts`
- `ux-review-banner.tsx` → `src/components/feedback/ux-review-banner.tsx`

Then run:

```bash
git update-index --skip-worktree src/lib/fetch-json.ts src/components/providers.tsx package.json
```

## Undo skip-worktree (if you need git to track those files again)

```bash
git update-index --no-skip-worktree src/lib/fetch-json.ts src/components/providers.tsx package.json
```
