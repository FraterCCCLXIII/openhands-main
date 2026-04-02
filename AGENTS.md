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
