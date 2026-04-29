# Company Website Agent Guide

## Validation Scripts

### Position/Structure Validation
Located at: `scripts/validate-home-comprehensive.cjs`
- Checks: Section heights, Y positions, element counts, text content
- Use: `node scripts/validate-home-comprehensive.cjs`

### Visual Style Validation
Located at: `scripts/validate-visual-styles.cjs`
- Checks: Background colors/gradients, font sizes, text colors
- Use: `node scripts/validate-visual-styles.cjs`
- **Important**: The position validator doesn't catch CSS visual properties like backgrounds, font sizes, or colors. Always run BOTH validators when comparing to live site.

## Common Discrepancy Patterns

### Background Colors
- Live site uses page-level background (`rgb(249, 240, 217)`) with transparent sections
- Test site may incorrectly add gradients or colors to individual sections
- Check: Section backgrounds should typically be transparent

### Font Sizes
- h2 elements on live site consistently use 44px
- Test site may use different sizes (40px, 48px from Tailwind classes)
- Fix: Use explicit `text-[44px]` instead of `text-5xl` or similar

### Section Classes
- `section-title`: 44px on desktop (not 40px)
- `testimonial-quote`: 44px on desktop

## Build & Test Commands
```bash
npm run build             # Build for production
npm run dev               # Run dev server (usually port 12001 in this workspace)
npm run parity:checklist  # Crawl openhands.dev and compare against local site
```

### Parity Audit Output
- Script: `scripts/generate-site-parity-checklist.cjs`
- Output: `.agent_tmp/parity/site-parity-checklist.{json,md}`
- Helpful env vars:
  - `PARITY_MAX_PAGES` to cap crawl size
  - `PARITY_DISCOVERY_LIMIT` to cap link discovery breadth
  - `PARITY_OUTPUT_DIR` to redirect report output

## Tailwind Color Tokens
- `brand-bg`: `#F9F0D9` (tan/beige)
- `brand-fg`: `#22150d` (dark brown)
- `brand-accent`: `#FFFF8B` (yellow)
- `brand-muted`: `#7b6d5d` (muted brown)

## Shared Shell Parity Notes
- Shared marketing chrome/nav/footer links are centralized in `src/constants/site-shell.ts`.
- For parity work on issue-based PRs, store browser screenshots under `.pr/issue-<number>/` and include both local and live captures for the analogous page.
- `.github/workflows/pr-artifacts.yml` is intended to remove `.pr/` from the base branch after a PR merges.
- For a production-style local parity check, build first and then run: `PORT=12001 npx react-router-serve build/server/nodejs_eyJydW50aW1lIjoibm9kZWpzIn0/index.js`.

## Homepage Parity Notes
- The live `/` page uses a 32px desktop heading for `Start with a proven workflow`; other homepage major headings remain 44px.
- Homepage CTA buttons that compare against live cards/FAQ should use square corners (`rounded-none`) and dark-card outline buttons should use `text-brand-bg` instead of pure white for parity.
- The homepage testimonial/social quote cards on live split some posts into multiple paragraphs; if parity audit reports missing `P:` items, check whether the local card collapsed multiple lines into one paragraph.
- `PARITY_MAX_PAGES=10 npm run parity:checklist` is enough to recheck `/` plus major top-level routes during homepage work.

## Metadata / Branding Parity Notes
- Route meta tags should use `https://openhands.dev` for canonical and `og:url` values; avoid `https://www.all-hands.dev` on marketing routes.
- Shared static OG image for updated marketing/legal routes: `https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png`.
- Current external destinations: docs links should point to `https://docs.openhands.dev/openhands/usage/run-openhands/...` and careers links should point to `https://jobs.ashbyhq.com/OpenHands`.

## Blog Parity Notes
- Live `/blog` uses a centered hero with only the newsletter signup (no `Try it live` / `Build with SDK` CTA buttons), followed by one featured story card and a full grid of post cards.
- Live blog index grid cards show publication date plus title only; featured card uses a dark overlay with `Read more` CTA copy.
- Live blog/article links use the brand brown accent (`#8a5f45`) rather than bright blue, and article headings use medium-weight 44px desktop sizing instead of Quincy 48px/60px styles.
- Live blog article imagery uses softer 16px radius treatments, and the newsletter form uses `Share your email` placeholder plus the privacy-policy disclaimer.
- Blog inventory is auto-loaded from `src/posts/*.md` via `import.meta.glob`; adding a new Markdown file is enough to include it.
- Use frontmatter `slug` to pin a live blog route when the canonical URL does not match the title-derived slug.
- Use frontmatter `published: false` to keep retired posts in the repo while excluding them from the live/local blog inventory.

## Product / Enterprise / Pricing / Community Parity Notes
- Live `/product` uses dark interface cards: `Terminal / CLI`, `Web GUI`, and `SDK` headings plus `Learn more` links render in light text on a dark background.
- Live `/product` includes the comparison heading `The only open, secure, and scalable agent platform built for real engineering work` and a second `See developer docs` CTA near the page footer.
- Live `/enterprise` uses paragraph tags for the six feature titles, `Powering enterprise AI with the world’s best` is 32px (not 44px), and the page-specific closing CTA copy is `Bring agentic development to your organization.` / `Deploy securely. Scale confidently. Stay in control.`
- Live `/pricing` parity depends on rendering comparison-table copy in visible `p`/`label` elements; checklist extraction does not inspect plain `th`/`td` text reliably.
- Live `/community` uses a dark `Latest Community Call` block and a dark `Start contributing` block, with event titles as `h2` elements and event descriptions using ASCII apostrophes (`We'll`).
- After issue #278 work, parity checklist counts dropped to: `/product` 1 fail, `/enterprise` 2 fails, `/pricing` 2 fails, `/community` 0 fails using `PARITY_MAX_PAGES=12 PARITY_DISCOVERY_LIMIT=20 TEST_ORIGIN=http://127.0.0.1:12001 LIVE_ORIGIN=https://openhands.dev npm run parity:checklist`.
