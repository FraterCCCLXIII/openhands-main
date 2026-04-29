# Screenshot review checklist for PR #296

## Verdict

The original screenshot pairs were **not actually the same**. They were materially different in layout, section order, CTA composition, and visual treatment.

This checklist records:
1. the cosmetic/content differences found in the original PR screenshots, and
2. a second-pass review after the parity fixes in this branch.

---

## Original screenshot review: confirmed differences

### `/product`
- [x] Hero was missing the yellow `Product` eyebrow tag.
- [x] Hero background treatment was wrong: local lacked the dense ASCII backdrop used on live.
- [x] CTA set was wrong: local had an extra `Join Slack` hero CTA that was not present in live.
- [x] Main product surfaces were laid out as **three static cards in a light section** instead of **three alternating text/image rows on a dark section**.
- [x] `Learn more` links were styled as underlined text instead of muted filled buttons.
- [x] Comparison section used a rounded white card with `Yes/No` text instead of the live comparison-table styling.
- [x] Bottom CTA/footer region differed substantially in spacing and composition.

### `/product/cli`
- [x] Local page had an extra top `Get started with OpenHands Open Source` download panel that did not exist in the live screenshot.
- [x] Section order was wrong: local inserted a large hero image block and extra accent block that were not present in the live layout.
- [x] The intro/proof sequence was wrong; live used a yellow intro band followed by a dark proof band.
- [x] `Key capabilities` and `How teams use it` were structured incorrectly: local stacked two screenshots on the right and used a separate card for use cases instead of the live two-row split layout.
- [x] Comparison section styling did not match the live dark section.
- [x] FAQ section structure did not match the live two-column layout.
- [x] Closing CTA section background/treatment did not match the live yellow ASCII-backed footer CTA.

### `/product/gui`
- [x] Hero was missing the yellow `Web GUI` eyebrow tag and live-style ASCII backdrop.
- [x] Section order was wrong: local placed the screenshot directly below the hero, but the live page used a dark split section with image left and intro copy right.
- [x] Local included an extra dark-hole section that was not present in the live screenshot.
- [x] `Trust requires visibility.` appeared in the wrong visual treatment/order.
- [x] `Key capabilities` and `How teams use it` had the same structural mismatch as the CLI page.
- [x] Comparison, FAQ, and closing CTA sections were not visually aligned with the live page.

### `/product/sdk`
- [x] Hero was missing the yellow `SDK` eyebrow tag and live-style ASCII backdrop.
- [x] Local inserted extra image/accent sections that were not present in the live layout.
- [x] The live yellow intro band + dark proof band sequence was not preserved.
- [x] `Key capabilities` and `How teams use it` used the wrong layout structure.
- [x] Comparison section used the wrong visual treatment.
- [x] FAQ and closing CTA sections were not arranged/styled like the live screenshot.

---

## Second-pass review after fixes

After the refactor in this branch, the product screenshots are **much closer** and the major structural mismatches above have been fixed.

### Fixed in this pass
- [x] Restored hero eyebrow tags on `/product`, `/product/cli`, `/product/gui`, and `/product/sdk`.
- [x] Restored live-style ASCII hero backgrounds on all four product routes.
- [x] Removed the extra `/product` hero `Join Slack` CTA.
- [x] Rebuilt `/product` to use alternating dark feature rows instead of the incorrect 3-card light-grid layout.
- [x] Rebuilt `/product/cli`, `/product/gui`, and `/product/sdk` around the correct section ordering and split layouts.
- [x] Moved subpage comparison tables into the live-style dark comparison section.
- [x] Reworked subpage FAQ sections into the live-style left-heading / right-accordion layout.
- [x] Reworked subpage closing CTAs into yellow ASCII-backed footer CTA sections.

### Remaining small differences to keep an eye on
- [ ] Shared footer nav/resources layout is still not pixel-identical to the live footer composition.
- [ ] Some typography and spacing still differ slightly (hero line breaks, paragraph width, button sizing, and section padding).
- [ ] Background ASCII density/placement is close, but not an exact raster match to live.
- [ ] Image card sizing and margins are close, but not pixel-identical in every section.

---

## Updated artifacts

- Updated screenshots:
  - `.pr/issue-291/updated/product-root-local.png`
  - `.pr/issue-291/updated/product-root-live.png`
  - `.pr/issue-291/updated/product-cli-local.png`
  - `.pr/issue-291/updated/product-cli-live.png`
  - `.pr/issue-291/updated/product-gui-local.png`
  - `.pr/issue-291/updated/product-gui-live.png`
  - `.pr/issue-291/updated/product-sdk-local.png`
  - `.pr/issue-291/updated/product-sdk-live.png`
- Updated parity report:
  - `.pr/issue-291/updated/parity/site-parity-checklist.md`
- Pixel-diff artifacts:
  - `.pr/issue-291/updated/*-diff.png`
