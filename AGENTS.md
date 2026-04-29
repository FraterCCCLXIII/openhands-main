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

### Cross-route parity checklist
Located at: `scripts/generate-site-parity-checklist.cjs`
- Checks: visible text/signature inventory, heading order, style mismatches, first-instance layout mismatches, unexpected extra elements on the test site, and screenshot pixel diffs for the first `PARITY_SCREENSHOT_PAGE_LIMIT` routes
- Use: `PARITY_MAX_PAGES=12 PARITY_DISCOVERY_LIMIT=20 PARITY_SCREENSHOT_PAGE_LIMIT=12 TEST_ORIGIN=http://127.0.0.1:12001 LIVE_ORIGIN=https://openhands.dev node scripts/generate-site-parity-checklist.cjs`
- Output: Markdown/JSON parity reports plus screenshot artifacts under `PARITY_OUTPUT_DIR`

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

## Company Page Parity Notes
- `/about`, `/contact`, `/press`, and `/manifesto` now use live Webflow copy patterns rather than the older marketing-page placeholders.
- The about page roster is sourced from `src/constants/members.ts` as an ordered `teamMembers` list that matches the live team names and roles.
- The contact page intentionally mirrors the live enterprise lead form fields/placeholders (`James`, `Smith`, `Acme`, `email@company.com`, `Send us a note here....`) for parity tests.
- Company pages should render the shared bottom CTA via `src/components/marketing-footer-cta.tsx` before the standalone site footer.

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
- Support known live blog slug aliases locally, and redirect unknown live-only slugs to `https://openhands.dev/blog/:slug` instead of returning a 404/500 from our app.
- Current live parity expects the featured `/blog` story to stay pinned to `openhands-index`; the article grid and article-footer related posts should come from the remaining reverse-chronological posts.
- Some live blog posts need frontmatter dates that differ from Webflow's `<title>` metadata date. Use frontmatter `seoTitleDate` when the visible publication date and the browser title date diverge.
- Shared article-template parity now depends on three template details: a `← Back to Blog` link, related-post cards whose title itself is the anchor text, and the marketing footer CTA block beneath the newsletter section.
- Most article hero images still use 16px rounding, but `agent-control-plane` currently needs a square hero image for parity; use frontmatter `coverRadius: "none"` for one-off overrides.

## Product / Enterprise / Pricing / Community Parity Notes
- Live `/product` uses dark interface cards: `Terminal / CLI`, `Web GUI`, and `SDK` headings plus `Learn more` links render in light text on a dark background.
- Live `/product` includes the comparison heading `The only open, secure, and scalable agent platform built for real engineering work` and a second `See developer docs` CTA near the page footer.
- Live `/enterprise` uses paragraph tags for the six feature titles, `Powering enterprise AI with the world’s best` is 32px (not 44px), and the page-specific closing CTA copy is `Bring agentic development to your organization.` / `Deploy securely. Scale confidently. Stay in control.`
- Live `/pricing` parity depends on rendering comparison-table copy in visible `p`/`label` elements; checklist extraction does not inspect plain `th`/`td` text reliably.
- Live `/community` uses a dark `Latest Community Call` block and a dark `Start contributing` block, with event titles as `h2` elements and event descriptions using ASCII apostrophes (`We'll`).
- After issue #278 work, parity checklist counts dropped to: `/product` 1 fail, `/enterprise` 2 fails, `/pricing` 2 fails, `/community` 0 fails using `PARITY_MAX_PAGES=12 PARITY_DISCOVERY_LIMIT=20 TEST_ORIGIN=http://127.0.0.1:12001 LIVE_ORIGIN=https://openhands.dev npm run parity:checklist`.
- Keep dedicated product detail pages at `/product/sdk`, `/product/gui`, and `/product/cli`, and wire the main product interface cards to those routes.
- `joinslack` should behave as a server redirect, not a client-only redirect, so crawlers and non-JS clients match the live `301` to `https://dub.sh/openhands`.

## Product Subpage Parity Notes
- `/product/cli`, `/product/gui`, and `/product/sdk` now share product-page helpers in `src/components/product-feature-page.tsx`, while the main `/product` surface cards are sourced from `src/constants/product-surfaces.ts`; update those shared files first when parity issues affect more than one product surface.
- Live product subpages use dedicated `/product/...` routes rather than external docs links from the surface cards on `/product`.
- Screenshot review can catch major parity regressions that the checklist crawler misses. For `/product`, `/product/cli`, `/product/gui`, and `/product/sdk`, always inspect local-vs-live full-page screenshots for eyebrow badges, section order, alternating dark feature rows, dark comparison sections, two-column FAQ layout, and yellow ASCII footer CTAs.
- For button/link parity on the product subpages, the live Webflow pages expose different visible CTA labels vs. extracted anchor text in some hero buttons; preserve the `screenReaderLabel` support in `ProductPageActionLink` if parity regressions reappear.
- After the screenshot-driven parity pass on issue #291, the product routes were rebuilt around shared data-driven sections instead of ad hoc page-specific layouts, which made the screenshot structure much closer to live even though the automated parity checklist still reports many false-positive content/style mismatches.

## Legal Page Parity Notes
- Live `/privacy` renders the body as a narrow legal-rich-text block with a centered 32px desktop title, real `h2`/`h3` hierarchy, and the shared `MarketingFooterCta` above the global footer.
- Current live `/privacy` parity expects a duplicated `Changes to this Privacy Policy` subsection and a trailing zero-width paragraph (`‍`) in the legal copy; keep both if parity checks regress on that route.
