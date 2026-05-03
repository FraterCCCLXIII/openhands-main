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

### Webflow Element Matching (data-wf-el)
- The parity script now supports matching `div` and other non-semantic elements between live Webflow and local sites via `data-wf-el` attributes.
- On the live site, elements are identified by their first Webflow semantic class name (e.g. `capabilities_card_wrap`). On the local site, elements carry `data-wf-el="capabilities_card_wrap"` to create the same anchor.
- **Proximity-based matching**: When a Webflow class appears multiple times on the live page (e.g. `card` ×4, `lovewall_cms_item` ×8), the script uses position + size similarity to match each local `data-wf-el` element to the closest live counterpart, rather than always picking the first DOM occurrence.
- The script compares computed styles and layout between matched pairs, reporting mismatches in a new "Webflow element mismatches (data-wf-el)" section.
- To add a new mapping: tag the local JSX element with `data-wf-el="webflow_class_name"`, then re-run the parity check.
- Unmatched elements (live classes without a local `data-wf-el`, or vice versa) are reported separately so coverage can be expanded incrementally.
- This was needed because the existing signature-based matching (`tag:normalizedText`) can't uniquely identify `div` elements (hundreds of visible divs per page with no text), and the two sites share zero semantic class names (Webflow uses names like `capabilities_card_wrap`, local uses pure Tailwind utilities).

### Font Strategy
- Live site uses **Sohne Kraftig** (proprietary, by Klim Type Foundry) for ALL text — body, headings, nav, cards, everything. Also loads Sohne Buch and General Sans.
- Local site uses **Klim test fonts** (`test-soehne-*.woff2`) registered as `"Sohne Kraftig"` so the computed `fontFamily` matches the live site exactly. These test fonts are metrically identical to the retail fonts but include a watermark overlay.
- Test font files live in `public/assets/fonts/test-soehne-*.woff2` and are **gitignored** (not committed). To set up locally, extract the needed weights from the Klim test font zip into that directory.
- Weight mapping: 300 → Leicht, 400 → Buch, 500 → Kräftig, 600 → Halbfett.
- The parity script's `FONT_EQUIVALENTS` map only has `geistmono → ui-monospace`. No Sohne equivalence is needed since the font name matches live exactly.
- Quincy CF is no longer used for headings on the homepage (live uses sans-serif everywhere). Quincy CF still exists in the repo for potential use on other pages.
- If test fonts are not installed, the fallback chain is `Inter, Arial, sans-serif`.

### Cross-route parity checklist
Located at: `scripts/generate-site-parity-checklist.cjs`
- Checks: visible text/signature inventory, heading order, style mismatches (including font family, cursor, text-decoration, letter-spacing), first-instance layout mismatches, container/section background style auditing, interactive element inventory and behavior comparison (cursor, transitions, pointer-events), per-element interactivity audit (cursor, pointerEvents, clickable role/semantics), hover effect comparison, unexpected extra elements on the test site, and screenshot pixel diffs for the first `PARITY_SCREENSHOT_PAGE_LIMIT` routes
- Use: `PARITY_MAX_PAGES=12 PARITY_DISCOVERY_LIMIT=20 PARITY_SCREENSHOT_PAGE_LIMIT=12 TEST_ORIGIN=http://127.0.0.1:12001 LIVE_ORIGIN=https://openhands.dev node scripts/generate-site-parity-checklist.cjs`
- Output: Markdown/JSON parity reports plus screenshot artifacts under `PARITY_OUTPUT_DIR`
- The report now includes per-route sections for: container/section style mismatches, per-element interactivity mismatches, missing/extra interactive elements, interactivity behavior mismatches, and hover effect mismatches
- Per-element interactivity captures: cursor (pointer vs default), pointerEvents (none vs auto), and clickable semantics (button/link/form-control role mismatches)

## Common Discrepancy Patterns

### Background Colors
- Live site uses page-level background (`rgb(249, 240, 217)`) with transparent sections
- Test site may incorrectly add gradients or colors to individual sections
- Check: Section backgrounds should typically be transparent

### Font Sizes
- h2 elements on live site consistently use 44px
- Body paragraph text on live site uses `20.8px` (= `1.3rem`), not 16px or 18px
- Test site may use different sizes (40px, 48px from Tailwind classes)
- Fix: Use explicit `text-[44px]` for headings, `text-[20.8px] leading-[1.2]` for body paragraphs on desktop
- Pattern: `text-lg text-brand-muted lg:text-[20.8px] lg:leading-[1.2]` for responsive body text

### Button/CTA Styles
- Live Webflow CTAs use **square corners** (`border-radius: 0px`) and **underline text decoration** (`underline 1.6px`)
- `--btn-border-radius` CSS variable controls this globally
- CTA buttons use the `.btn` class which includes underline styling

### Text Colors
- Live muted text: `rgb(95, 95, 95)` = `#5f5f5f` — a neutral gray, NOT warm brown
- Dark section muted text: `#b3a88c` — a warm muted tan on dark backgrounds
- Use `text-brand-muted` for light-bg sections (resolves to `#5f5f5f`)
- Use `text-[#b3a88c]` for dark card sections directly

### Cursor Styles
- Live FAQ labels use `cursor: default`, not `pointer`
- Live nav dropdown buttons (Resources) use `cursor: default`
- Live carousel/workflow cards use `cursor: grab` for draggable feel

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
- The shared footer nav wrapper now defaults to `max-w-[825px]`; parity-sensitive routes can still tighten it (for example `max-w-[760px]`) via the `Footer` component’s `navWidthClass` prop.
- For a production-style local parity check, build first and then run: `PORT=12001 npx react-router-serve build/server/nodejs_eyJydW50aW1lIjoibm9kZWpzIn0/index.js`.

## Homepage Parity Notes
- The live `/` page uses a 32px desktop heading for `Start with a proven workflow`; other homepage major headings remain 44px.
- Homepage CTA buttons that compare against live cards/FAQ should use square corners (`rounded-none`) and dark-card outline buttons should use `text-brand-bg` instead of pure white for parity.
- The homepage testimonial/social quote cards on live split some posts into multiple paragraphs; if parity audit reports missing `P:` items, check whether the local card collapsed multiple lines into one paragraph.
- Homepage parity on `/` is sensitive to semantic visibility, not just visuals: the checker only inventories visible `h*`, `a`, `button`, `p`, `label`, and `img` elements. Use non-heading/container tags for hero/quote/footer display text when live Webflow renders them as styled `div`s, and keep workflow/footer icon controls textless if the live site exposes only icon buttons.
- Live homepage footer layout is a single combined nav/resources/contact block with social icons above it. Keeping `Contact` outside the stacked resource list and tinting the active `Home` link with `#8a5f45` avoids recurring shared-shell mismatches.
- Homepage workflow cards should use the live Webflow SVG icons instead of emoji, and if you show visible `Launch` text, keep it out of the actual `<button>` text content (for example, visible `div` text plus an overlay button) so the parity checker does not add unexpected `BUTTON:` signatures.
- The homepage `Developers love OpenHands` wall aligns closer to live with a 3-column desktop grid and slightly taller cards; this section materially affects downstream FAQ/footer Y-position parity.
- For homepage parity spacing that uses exact one-off pixel values, prefer inline styles or static Tailwind class strings; dynamically assembled arbitrary classes may not be emitted into the production CSS.

- `PARITY_MAX_PAGES=10 npm run parity:checklist` is enough to recheck `/` plus major top-level routes during homepage work.

## Company Page Parity Notes
- `/about`, `/contact`, `/press`, and `/manifesto` now use live Webflow copy patterns rather than the older marketing-page placeholders.
- The about page roster is sourced from `src/constants/members.ts` as an ordered `teamMembers` list that matches the live team names and roles.
- The contact page intentionally mirrors the live enterprise lead form fields/placeholders (`James`, `Smith`, `Acme`, `email@company.com`, `Send us a note here....`) for parity tests.
- Company pages should render the shared bottom CTA via `src/components/marketing-footer-cta.tsx` before the standalone site footer, and the footer-gating logic must normalize trailing slashes (`/about/` should behave like `/about`).
- Live `/about` semantics use `H3: Team`, a paragraph subtitle, and paragraph-only member name/title text; the roster is a vertical image-above-text grid, and the milestone labels should not be rendered as visible `p` elements.
- `/about` team headshots should render in fixed `190px × 190px` media frames; expanding them to full column width creates large cumulative Y-offset drift across the roster.
- `/about` milestone parity is sensitive to the dark panel height and should use a CSS background layer (not a visible `<img>`) so screenshot/layout parity improves without introducing extra `IMG:` signatures.
- Live `/contact` uses a centered hero above the two-column content, a visible non-heading `Why enterprises choose OpenHands` block, a visible `Trusted by engineers at` logo area, paragraph-style form labels, and an `input[type="submit"]` control.
- `/contact` logo parity matches best with an eight-column desktop logo grid (two rows) instead of a taller four-column stack or a horizontally overflowing marquee.
- Live `/press` uses paragraph dates/titles plus plain text `Read more` links instead of heading-based cards or outline buttons.
- Live `/manifesto` uses an `H3` intro block plus `H3` closing sections, while the manifesto principles themselves are paragraph blocks with bold lead-ins rather than separate headings.
- `/manifesto` heading-order parity depends on preserving the trailing zero-width paragraph marker (`‍`) after the intro `We believe:` heading block.
- For these company routes, avoid adding an extra top padding offset to `<main>`; the shared sticky header already occupies layout space on the live pages.

## Metadata / Branding Parity Notes
- Route meta tags should use `https://openhands.dev` for canonical and `og:url` values; avoid `https://www.all-hands.dev` on marketing routes.
- Shared static OG image for updated marketing/legal routes: `https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png`.
- Current external destinations: docs links should point to `https://docs.openhands.dev/openhands/usage/run-openhands/...` and careers links should point to `https://jobs.ashbyhq.com/OpenHands`.

## Blog Parity Notes
- Live `/blog` uses a centered hero with only the newsletter signup (no `Try it live` / `Build with SDK` CTA buttons), followed by one featured story card and a full grid of post cards.
- Live blog index grid cards show publication date plus title only; featured card uses a dark overlay with `Read more` CTA copy.
- Live blog/article links use the brand brown accent (`#8a5f45`) rather than bright blue, and article headings use medium-weight 44px desktop sizing instead of Quincy 48px/60px styles.
- Live blog article cover images use 8px border-radius (`--card-border-radius: 0.5rem`), and the newsletter form uses `Share your email` placeholder plus the privacy-policy disclaimer.
- Blog inventory is auto-loaded from `src/posts/*.md` via `import.meta.glob`; adding a new Markdown file is enough to include it.
- Use frontmatter `slug` to pin a live blog route when the canonical URL does not match the title-derived slug.
- Use frontmatter `published: false` to keep retired posts in the repo while excluding them from the live/local blog inventory.
- Support known live blog slug aliases locally, and redirect unknown live-only slugs to `https://openhands.dev/blog/:slug` instead of returning a 404/500 from our app.
- Current live parity expects the featured `/blog` story to stay pinned to `openhands-index`; the article grid and article-footer related posts should come from the remaining reverse-chronological posts.
- Some live blog posts need frontmatter dates that differ from Webflow's `<title>` metadata date. Use frontmatter `seoTitleDate` when the visible publication date and the browser title date diverge.
- Shared article-template parity now depends on three template details: a `← Back to Blog` link, related-post cards whose title itself is the anchor text, and the marketing footer CTA block beneath the newsletter section.
- Blog article body parity is sensitive to Webflow-like rich text spacing: paragraph body images use 8px rounding with no extra image margins, centered Webflow figure images use `max-width: 60%` (the Webflow `.w-richtext figure` default) with `margin: 3em 0` and `border-radius: 0.5rem; overflow: hidden` matching live `.rich-text figure` CSS, raw `<pre><code>` blocks should not gain leading/trailing blank lines, and related-post card links should wrap the full card so their link rectangle stays card-height.
- The shared `MarketingFooterCta` title currently needs to render as plain text (`div`) by default for parity-sensitive routes/tests; only opt into `semanticHeading={true}` if a route explicitly needs heading semantics.
- Live Webflow newsletter markup always includes a hidden `Thank you for your submission!` success block in the DOM, even before form submission; keep the hidden success heading in `NewsletterForm` so prerendered heading inventories match parity checks.
- Blog frontmatter now supports `coverAlt` for live image-alt parity and `seoTitleDate` for browser-title date parity; prefer those fields over mutating visible publication dates when only metadata differs from live.

- Article hero/cover images now use 8px rounding by default, but `agent-control-plane` currently needs a square hero image for parity; use frontmatter `coverRadius: "none"` for one-off overrides.

## Product / Enterprise / Pricing / Community Parity Notes
- Live `/product` uses dark interface cards: `Terminal / CLI`, `Web GUI`, and `SDK` headings plus `Learn more` links render in light text on a dark background.
- Live `/product` includes the comparison heading `The only open, secure, and scalable agent platform built for real engineering work` and a second `See developer docs` CTA near the page footer.
- Live `/enterprise` uses paragraph tags for the six feature titles, `Powering enterprise AI with the world’s best` is 32px (not 44px), and the page-specific closing CTA copy is `Bring agentic development to your organization.` / `Deploy securely. Scale confidently. Stay in control.`
- Live `/pricing` parity depends on rendering comparison-table copy in visible `p`/`label` elements; checklist extraction does not inspect plain `th`/`td` text reliably.
- Pricing screenshot parity improves when the hero/cards share the ASCII backdrop, the comparison table is rendered as a dark full-width block without a separate visible `Compare plans` heading, and the FAQ uses collapsed divider rows instead of open rounded cards.
- Live `/community` uses a dark `Latest Community Call` block and a dark `Start contributing` block, with event titles as `h2` elements and event descriptions using ASCII apostrophes (`We'll`).
- After issue #278 work, parity checklist counts dropped to: `/product` 1 fail, `/enterprise` 2 fails, `/pricing` 2 fails, `/community` 0 fails using `PARITY_MAX_PAGES=12 PARITY_DISCOVERY_LIMIT=20 TEST_ORIGIN=http://127.0.0.1:12001 LIVE_ORIGIN=https://openhands.dev npm run parity:checklist`.
- Keep dedicated product detail pages at `/product/sdk`, `/product/gui`, and `/product/cli`, and wire the main product interface cards to those routes.
- `joinslack` should behave as a server redirect, not a client-only redirect, so crawlers and non-JS clients match the live `301` to `https://dub.sh/openhands`.
- Do not keep or add `mirror-*.tsx` marketing routes or `~/utils/webflow-mirror-route`; implement live pages natively instead.
- The whitepaper route `/whitepapers/modernize-legacy-systems-with-ai-agents` now lives in `src/routes/whitepapers.modernize-legacy-systems-with-ai-agents.tsx`; tests cover route registration, metadata, and the client-side PDF download reveal using the local PDF path `/assets/webflow/whitepapers/openhands-whitepaper.pdf`.
- Issue #325 added a reusable `OverlayLinkButton` helper for Webflow-style CTA parity: visible label text lives in an `aria-hidden` wrapper while the actual `<a>` is an absolute-positioned cover link with an sr-only label. Prefer it on commercial/product CTA buttons when live Webflow exposes text-plus-overlay-link markup instead of plain anchor text.
- Live `/product` and the commercial product detail routes treat many card/showcase images as decorative; use empty `alt` text for those images, but keep the CLI/SDK accent asset alt as the lowercase live string `asci art`.
- Live `/enterprise` currently serves a feature-flagged hero variant in parity checks: the visible H1 is `Open source agent infrastructure for code modernization` with subcopy `Build AI coding agents around your stack, your rules, your team.` The AMD quote remains an `h2`, `Measured impact` is a non-paragraph eyebrow, and the whitepaper promo title is a single `h3` without a separate `Whitepaper` paragraph.
- Live `/privacy` legal rich text only treats literal URL text as visible anchors in parity extraction; browser names, DAA references, and `contact@all-hands.dev` should remain plain text even if the markdown source contains links.
- Live whitepaper parity is sensitive to control semantics: `What you'll learn in the whitepaper:` should be an `h3`, form field labels should be visually hidden (with placeholders / aria-labels carrying the copy), and the primary submit control should be an `input[type="submit"]` rather than a visible `<button>` label block.


## Product Subpage Parity Notes
- `/product/cli`, `/product/gui`, and `/product/sdk` now share product-page helpers in `src/components/product-feature-page.tsx`, while the main `/product` surface cards are sourced from `src/constants/product-surfaces.ts`; update those shared files first when parity issues affect more than one product surface.
- Live product subpages use dedicated `/product/...` routes rather than external docs links from the surface cards on `/product`.
- Screenshot review can catch major parity regressions that the checklist crawler misses. For `/product`, `/product/cli`, `/product/gui`, and `/product/sdk`, always inspect local-vs-live full-page screenshots for eyebrow badges, section order, alternating dark feature rows, dark comparison sections, two-column FAQ layout, and yellow ASCII footer CTAs.
- For button/link parity on the product subpages, the live Webflow pages expose different visible CTA labels vs. extracted anchor text in some hero buttons; preserve the `screenReaderLabel` support in `ProductPageActionLink` if parity regressions reappear.
- Live product/commercial parity depends on a few non-obvious semantics from the Webflow export: product hero primary CTAs keep visible labels like `Try it live` / `Get Started`, but their accessible label should be `Join Slack`; comparison/footer CTA titles often render as styled `div` text instead of semantic `h2`, while FAQ question text should stay inside `label` elements within `summary` rows.
- On `/product/cli` and `/product/sdk`, the first post-hero section must render the standalone hero image asset (no rounded card treatment), and the dark proof band should render the separate ASCII accent image (`page.accentImage`) so parity audits can match the live image inventory.

- After the screenshot-driven parity pass on issue #291, the product routes were rebuilt around shared data-driven sections instead of ad hoc page-specific layouts, which made the screenshot structure much closer to live even though the automated parity checklist still reports many false-positive content/style mismatches.

## Legacy Route / 404 Parity Notes
- The legacy whitepaper path `/whitepapers/modernize-legacy-systems-with-ai-agents` is implemented as a first-class local route, not a redirect or iframe mirror, because the parity checklist reads visible DOM text directly.
- Unknown marketing routes now fall through to `route("*", "routes/not-found.tsx")`, which returns a 404 status via `data(null, { status: 404 })` while still rendering inside the normal marketing chrome so the live-style nav/footer signatures remain visible.

## Legal Page Parity Notes
- Live `/privacy` renders the body as a narrow legal-rich-text block with a centered 32px desktop title, real `h2`/`h3` hierarchy, and the shared `MarketingFooterCta` above the global footer.
- Current live `/privacy` parity expects a duplicated `Changes to this Privacy Policy` subsection and a trailing zero-width paragraph (`‍`) in the legal copy; keep both if parity checks regress on that route.

- Proximity scoring in `compareWebflowElements` should weight top/left position higher than width/height, since cross-site elements share approximate page positions more reliably than exact dimensions.
- When live and test have equal counts of elements with the same `data-wf-el` key, index-based (DOM-order) matching eliminates cross-pairing in repeated grid/list items.
- Live Webflow pages reuse class names across semantically different contexts (e.g. `eyebrow` for tab pills AND section labels, `lovewall_cms_item_top_name` for both author names AND titles). Tag each distinct usage separately and ensure counts match for index-based matching.
- SVG elements don't reliably compute `textUnderlineOffset`; wrap SVGs in a `<div>` with the `data-wf-el` attribute to get correct computed style values.
- Live sections use `display: block`, transparent backgrounds, and `padding: 80px 0`. The tan page color comes from the body/page-wrapper, not individual sections.
