#!/usr/bin/env node

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const puppeteer = require('puppeteer');
const { PNG } = require('pngjs');
const pixelmatchModule = require('pixelmatch');
const { backgroundImagesMatch } = require('./lib/webflow-asset-parity.cjs');

const pixelmatch = pixelmatchModule.default || pixelmatchModule;

const LIVE_ORIGIN = process.env.LIVE_ORIGIN || 'https://openhands.dev';
const TEST_ORIGIN = process.env.TEST_ORIGIN || process.argv[2] || 'http://localhost:12001';
const OUTPUT_DIR = path.resolve(process.cwd(), process.env.PARITY_OUTPUT_DIR || '.agent_tmp/parity');
const MAX_PAGES = Number(process.env.PARITY_MAX_PAGES || 200);
const DISCOVERY_PAGE_LIMIT = Number(process.env.PARITY_DISCOVERY_LIMIT || 60);
const VIEWPORT = {
  width: Number(process.env.PARITY_VIEWPORT_WIDTH || 1440),
  height: Number(process.env.PARITY_VIEWPORT_HEIGHT || 2400),
};
const PROTOCOL_TIMEOUT = Number(
  process.env.PARITY_PROTOCOL_TIMEOUT || process.env.PARITY_PROTOCOL_TIMEOUT_MS || 300000,
);
const SCREENSHOT_PAGE_LIMIT = Number(process.env.PARITY_SCREENSHOT_PAGE_LIMIT || Math.min(MAX_PAGES, 20));
const SCREENSHOT_DIFF_THRESHOLD = Number(process.env.PARITY_SCREENSHOT_DIFF_THRESHOLD || 2);
const DEFAULT_DISCOVERY_PATHS = [
  '/',
  '/product',
  '/product/cli',
  '/product/gui',
  '/product/sdk',
  '/enterprise',
  '/pricing',
  '/community',
  '/about',
  '/contact',
  '/press',
  '/manifesto',
  '/privacy',
  '/blog',
  '/whitepapers/modernize-legacy-systems-with-ai-agents',
];

const SCREENSHOT_CHUNK_HEIGHT = Number(process.env.PARITY_SCREENSHOT_CHUNK_HEIGHT || 6000);
const SCREENSHOT_CHUNK_TRIGGER_HEIGHT = Number(process.env.PARITY_SCREENSHOT_CHUNK_TRIGGER_HEIGHT || 12000);
// ── Visual style properties compared per-element ──
// Grouped by category for clarity in diff reports
const STYLE_PROPS = [
  // Typography
  'fontSize',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textTransform',
  'textDecoration',
  'textDecorationColor',
  'textDecorationThickness',
  'textUnderlineOffset',
  'whiteSpace',
  // Color
  'color',
  'backgroundColor',
  'backgroundImage',
  // Border  (borderWidth=0 diffs are filtered out at comparison time)
  'borderRadius',
  'borderWidth',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'borderColor',
  // Layout alignment (catches flex-item alignment differences)
  'alignSelf',
  'verticalAlign',
  // Replaced media/object styles are common root causes of pixel drift:
  // e.g. an image with object-fit: cover and a forced 16:9 wrapper can
  // report the same src but render hundreds of pixels smaller/taller than
  // live. Capture the style cause alongside the rect symptom.
  'objectFit',
  'objectPosition',
  // Layout-affecting box model (catches DOM-structural differences like
  // overlay-link <a> with position:absolute filling its wrapper vs.
  // inline-flex <a> with text-only dimensions)
  'position',
  'display',
  'overflow',
  'boxSizing',
  // Margin/padding on the element itself.  These are the most direct
  // root cause of cumulative Y-position drift when a downstream element
  // shifts but its own height/style is identical (e.g. an H1 with
  // `margin-bottom: 16px` on test vs `0` on live pushes every following
  // section down by 16px; without capturing margin here the parity audit
  // saw only the symptom — `top: live=222 test=249` on the next P — with
  // no clue why).  Padding is included for symmetry and to catch
  // `padding-bottom` differences that swell button/link heights.
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  // Effects / interactivity
  'cursor',
  'opacity',
  'boxShadow',
];
const STYLE_CHECK_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BUTTON', 'LABEL', 'INPUT', 'IMG', 'P', 'SPAN', 'DIV', 'SUMMARY', 'DETAILS', 'NAV', 'SECTION', 'ARTICLE', 'UL', 'LI', 'PRE', 'CODE']);
const LAYOUT_CHECK_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'A', 'BUTTON', 'LABEL', 'INPUT', 'IMG', 'P', 'DIV', 'PRE', 'CODE']);

const CONTAINER_STYLE_PROPS = [
  'backgroundColor',
  'backgroundImage',
  'borderRadius',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  // Margins are common root causes of layout drift (e.g. `mt-4` vs `mt-[49.6px]`
  // on a card grid wrapper). Capture them so wf-element comparison surfaces the
  // styling that produced the layout mismatch, not just the symptom.
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  // Min/max height/width are also frequent root causes — e.g. a `minHeight:
  // 380px` card forces extra height that the live card doesn't carry, pushing
  // every downstream section's Y-position by hundreds of pixels.
  'minHeight',
  'minWidth',
  'maxHeight',
  'maxWidth',
  'width',
  'height',
  'aspectRatio',
  'overflow',
  'boxSizing',
  'display',
  'flexDirection',
  'justifyContent',
  'alignItems',
  'gap',
];

const INTERACTIVE_STYLE_PROPS = [
  'cursor',
  'transition',
  'transform',
  'pointerEvents',
];

function normalizeWhitespace(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function normalizeTextKey(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function isAssetPath(pathname) {
  return /\.(?:xml|txt|json|png|jpe?g|gif|webp|svg|ico|pdf|zip|mp4|webm|css|js)$/i.test(pathname);
}

function normalizePath(input, origin = LIVE_ORIGIN) {
  try {
    const url = new URL(input, origin);
    if (url.origin !== new URL(origin).origin) return null;
    if (!/^https?:$/.test(url.protocol)) return null;
    if (isAssetPath(url.pathname)) return null;
    if (url.pathname.startsWith('/cdn-cgi/')) return null;
    if (url.pathname.startsWith('/api/')) return null;
    const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
    return pathname || '/';
  } catch {
    return null;
  }
}

function sanitizePathForFile(routePath) {
  if (routePath === '/') return 'root';
  return routePath.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'route';
}

function parsePx(value) {
  if (!value || value === 'normal') return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseColor(value) {
  const match = (value || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
  if (!match) return null;
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] === undefined ? 1 : Number(match[4]),
  };
}

function normalizeFontFamily(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((f) => f.trim().replace(/^["']|["']$/g, '').toLowerCase())
    .filter(Boolean);
}

// Accepted font substitutions: live proprietary → local equivalent.
// When Klim test fonts are installed locally, the font-family name matches
// the live site exactly ("Sohne Kraftig") so no equivalence is needed.
// Keep mappings here only for fonts we genuinely substitute.
const FONT_EQUIVALENTS = {
  'geistmono': 'ui-monospace',
};

function primaryFontMatches(liveValue, testValue) {
  const liveFonts = normalizeFontFamily(liveValue);
  const testFonts = normalizeFontFamily(testValue);
  if (liveFonts.length === 0 && testFonts.length === 0) return true;
  if (liveFonts.length === 0 || testFonts.length === 0) return false;
  if (liveFonts[0] === testFonts[0]) return true;
  return FONT_EQUIVALENTS[liveFonts[0]] === testFonts[0];
}

function normalizeTransition(value) {
  if (!value || value === 'none' || value === 'all 0s ease 0s') return 'none';
  return value;
}

function compareStyleValue(prop, liveValue, testValue, liveStyle, testStyle) {
  if (liveValue === testValue) return null;

  if (prop === 'fontFamily') {
    if (primaryFontMatches(liveValue, testValue)) return null;
    const livePrimary = normalizeFontFamily(liveValue)[0] || '(none)';
    const testPrimary = normalizeFontFamily(testValue)[0] || '(none)';
    return `fontFamily: live=${livePrimary} test=${testPrimary}`;
  }

  if (prop === 'color' || prop === 'backgroundColor' ||
      prop === 'borderColor' || prop === 'textDecorationColor') {
    const liveColor = parseColor(liveValue);
    const testColor = parseColor(testValue);
    if (liveColor && testColor) {
      const tolerance = prop === 'backgroundColor' ? 16 : 12;
      const channelDiff =
        Math.abs(liveColor.r - testColor.r) +
        Math.abs(liveColor.g - testColor.g) +
        Math.abs(liveColor.b - testColor.b);
      const alphaDiff = Math.abs(liveColor.a - testColor.a);
      if (channelDiff <= tolerance * 3 && alphaDiff <= 0.15) return null;
    }
  }

  // Filter out border noise: ignore borderStyle/borderColor diffs when both
  // sides have borderWidth=0 (invisible borders from CSS resets like Tailwind)
  if (prop === 'borderStyle' || prop === 'borderColor') {
    const liveBW = parsePx(liveStyle?.borderWidth || '0');
    const testBW = parsePx(testStyle?.borderWidth || '0');
    if ((liveBW === null || liveBW === 0) && (testBW === null || testBW === 0)) return null;
  }

  if (prop === 'textDecoration') {
    const normalize = (v) => (v || 'none').replace(/\s+/g, ' ').trim().toLowerCase();
    if (normalize(liveValue) === normalize(testValue)) return null;
  }

  if (prop === 'letterSpacing') {
    if ((liveValue === 'normal' && testValue === '0px') ||
        (liveValue === '0px' && testValue === 'normal')) return null;
  }

  // minHeight / minWidth: 'auto' and '0px' both behave as "no contribution"
  // for non-flex/grid block boxes — the parity audit was reporting a noisy
  // mismatch on every section because live's <main> is display:flex (which
  // resolves min-* to 'auto') and a block-level <main> on test resolves them
  // to '0px'. The visible layout is identical in both cases, so treat them
  // as equivalent here.
  if (prop === 'minHeight' || prop === 'minWidth') {
    const norm = (v) => (v === 'auto' || v === '0px' ? '0px' : v);
    if (norm(liveValue) === norm(testValue)) return null;
  }

  // textAlign: treat 'start' and 'left' as equivalent (they are for LTR)
  if (prop === 'textAlign') {
    const normalizeAlign = (v) => (v === 'start' ? 'left' : v === 'end' ? 'right' : v);
    if (normalizeAlign(liveValue) === normalizeAlign(testValue)) return null;
  }

  // opacity: ignore small differences
  if (prop === 'opacity') {
    const diff = Math.abs(parseFloat(liveValue || '1') - parseFloat(testValue || '1'));
    if (diff <= 0.05) return null;
  }

  // boxShadow: normalize 'none'
  if (prop === 'boxShadow') {
    const normShadow = (v) => (v || 'none').toLowerCase().trim();
    if (normShadow(liveValue) === normShadow(testValue)) return null;
  }

  if (prop === 'cursor') {
    if (liveValue === testValue) return null;
  }

  if (prop === 'transition') {
    if (normalizeTransition(liveValue) === normalizeTransition(testValue)) return null;
  }

  const livePx = parsePx(liveValue);
  const testPx = parsePx(testValue);
  if (livePx !== null && testPx !== null) {
    // Tolerances kept tight for layout-driving properties (fontSize, lineHeight,
    // letterSpacing, fontWeight) so the script catches the underlying style
    // differences that cause cascading layout drift. The looser values used
    // previously (e.g. fontSize: 2px) were swallowing real diffs like
    // 14.4px vs 16px and 22.4px vs 24px lineHeight that affect text width
    // by tens of pixels per element across long documents.
    //
    // Sub-pixel rounding (e.g. 44px vs 43.9999px from clamp() math) is
    // handled by a small floor of 0.25px applied to every numeric prop.
    const toleranceByProp = {
      fontSize: 0.5,
      fontWeight: 50,
      lineHeight: 1,
      borderRadius: 3,
      letterSpacing: 0.25,
      textUnderlineOffset: 2,
      textDecorationThickness: 1,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 8,
      paddingRight: 8,
    };
    const tolerance = Math.max(0.25, toleranceByProp[prop] ?? 2);
    if (Math.abs(livePx - testPx) <= tolerance) return null;
  }

  if (prop === 'backgroundImage') {
    if (backgroundImagesMatch(liveValue, testValue, LIVE_ORIGIN, TEST_ORIGIN)) return null;

    const simplify = (value) => (value || '').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    if (simplify(liveValue) === simplify(testValue)) return null;
  }

  return `${prop}: live=${liveValue} test=${testValue}`;
}

// Text-related style properties that don't affect visual rendering of
// elements that don't render text (IMG, INPUT, embedded media). These
// values are still inherited via the cascade but are visually irrelevant
// for non-text elements — comparing them produces dozens of false-positive
// "fontFamily/color/textDecorationColor" diffs on IMG elements whose only
// difference is a different inherited cascade.
const TEXT_ONLY_STYLE_PROPS = new Set([
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textTransform',
  'textDecoration',
  'textDecorationColor',
  'textDecorationThickness',
  'textUnderlineOffset',
  'whiteSpace',
  'color',
]);
const NON_TEXT_TAGS = new Set(['IMG']);

function compareStyles(liveStyle, testStyle, tag) {
  const diffs = [];
  const skipText = tag && NON_TEXT_TAGS.has(tag);
  for (const prop of STYLE_PROPS) {
    if (skipText && TEXT_ONLY_STYLE_PROPS.has(prop)) continue;
    const diff = compareStyleValue(prop, liveStyle?.[prop], testStyle?.[prop], liveStyle, testStyle);
    if (diff) diffs.push(diff);
  }
  return diffs;
}

// Compare ancestor (wrapper/container) styles captured during extraction.
// Catches visual mismatches on parent elements like button wrappers with
// borderRadius or backgroundColor that the text-matched child doesn't carry.
// When an element has a layoutDiff (top/left/width/height) but its own style
// diffs don't explain it, the cause is usually on a parent: extra padding,
// margin, gap, or a different display/flex direction. Capture those props on
// the nearest visual ancestor so the report surfaces the cause, not the
// symptom.
const ANCESTOR_COMPARE_PROPS = [
  'borderRadius',
  'backgroundColor',
  'boxShadow',
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'display',
  'flexDirection',
  'gap',
];
const LAYOUT_CONTEXT_PROPS = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'transform',
  'overflow',
  'boxSizing',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'aspectRatio',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'gap',
  'columnGap',
  'rowGap',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'alignContent',
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridAutoFlow',
  'gridAutoColumns',
  'gridAutoRows',
  'gridColumn',
  'gridRow',
];

function compareLayoutContextStyles(liveContext, testContext, layoutDiffs = []) {
  if (!layoutDiffs.length || (!liveContext && !testContext)) return [];
  if (!liveContext || !testContext) {
    const present = liveContext || testContext;
    const side = liveContext ? 'live-only' : 'test-only';
    return [`layoutContext.${present?._kind || 'ancestor'}: ${side} (${present?._tag || 'unknown'})`];
  }

  const diffs = [];
  for (const prop of LAYOUT_CONTEXT_PROPS) {
    const diff = compareStyleValue(prop, liveContext[prop], testContext[prop], liveContext, testContext);
    if (diff) diffs.push(`layoutContext.${liveContext._kind || 'ancestor'}.${diff}`);
  }
  return diffs;
}

function compareAncestorStyles(liveAncestor, testAncestor, livePageBg, testPageBg) {
  if (!liveAncestor && !testAncestor) return [];

  if (!liveAncestor || !testAncestor) {
    // One side has a visual ancestor within maxDepth levels, the other doesn't.
    // Only flag when the ancestor carries a *visible* property — a non-transparent
    // backgroundColor or a non-zero boxShadow.  BorderRadius alone on a transparent
    // container is invisible and creates noise from Webflow/React structural
    // differences (e.g. <nav> vs <header>, extra wrapper divs).
    // Also skip when the ancestor bg matches the page-level background — both
    // sites use the same page bg, so finding it on different wrapper elements
    // (e.g. Webflow page-wrapper div vs body) is not a meaningful visual diff.
    const present = liveAncestor || testAncestor;
    const ancestorBg = present.backgroundColor;
    const hasBg = ancestorBg &&
                  ancestorBg !== 'rgba(0, 0, 0, 0)' &&
                  ancestorBg !== 'transparent';
    const hasShadow = present.boxShadow &&
                      present.boxShadow !== 'none' &&
                      !/0px\s+0px\s+0px\s+0px/.test(present.boxShadow);
    if (!hasBg && !hasShadow) return [];
    // Ancestor bg matches page-level background on either side → not a visual diff
    if (hasBg && (ancestorBg === livePageBg || ancestorBg === testPageBg)) return [];
    const side = liveAncestor ? 'live-only' : 'test-only';
    return [`ancestor.container: ${side} (${present._tag})`];
  }
  const diffs = [];
  for (const prop of ANCESTOR_COMPARE_PROPS) {
    const lv = liveAncestor[prop];
    const tv = testAncestor[prop];
    if (lv === tv) continue;
    // Reuse numeric tolerance for px values
    const lPx = parsePx(lv);
    const tPx = parsePx(tv);
    if (lPx !== null && tPx !== null) {
      const tol = prop === 'borderRadius' ? 3
                : prop === 'padding' ? 8
                : prop.startsWith('padding') ? 4
                : prop.startsWith('margin') ? 4
                : prop === 'gap' ? 4
                : 2;
      if (Math.abs(lPx - tPx) <= tol) continue;
    }
    // Color tolerance for backgroundColor
    if (prop === 'backgroundColor') {
      const lc = parseColor(lv);
      const tc = parseColor(tv);
      if (lc && tc) {
        const cd = Math.abs(lc.r - tc.r) + Math.abs(lc.g - tc.g) + Math.abs(lc.b - tc.b);
        if (cd <= 48 && Math.abs(lc.a - tc.a) <= 0.15) continue;
      }
    }
    // boxShadow normalize — treat zero-extent shadows as equivalent to 'none'
    if (prop === 'boxShadow') {
      const normShadow = (v) => {
        const s = (v || 'none').toLowerCase().trim();
        if (s === 'none') return 'none';
        // Zero-extent inset/outset shadows (0px 0px 0px 0px) are invisible
        if (/^[\w(),.\s]*0px\s+0px\s+0px\s+0px/.test(s)) return 'none';
        return s;
      };
      if (normShadow(lv) === normShadow(tv)) continue;
    }
    diffs.push(`ancestor.${prop}: live=${lv} test=${tv}`);
  }
  return diffs;
}

function compareElementInteractivity(liveInt, testInt) {
  if (!liveInt || !testInt) return [];
  const diffs = [];

  // Cursor mismatch: e.g. live has pointer (clickable) but test has default (not clickable)
  if (liveInt.cursor !== testInt.cursor) {
    const isClickCursor = (c) => c === 'pointer';
    if (isClickCursor(liveInt.cursor) !== isClickCursor(testInt.cursor)) {
      diffs.push(`cursor: live=${liveInt.cursor} test=${testInt.cursor}`);
    }
  }

  // pointerEvents mismatch: live allows clicks but test blocks them (or vice versa)
  if (liveInt.pointerEvents !== testInt.pointerEvents) {
    const liveBlocked = liveInt.pointerEvents === 'none';
    const testBlocked = testInt.pointerEvents === 'none';
    if (liveBlocked !== testBlocked) {
      diffs.push(`pointerEvents: live=${liveInt.pointerEvents} test=${testInt.pointerEvents}`);
    }
  }

  // Button/link role mismatch: live is interactive but test is not (or vice versa)
  const liveClickable = liveInt.isButton || liveInt.isLink || liveInt.isFormControl || liveInt.role === 'button';
  const testClickable = testInt.isButton || testInt.isLink || testInt.isFormControl || testInt.role === 'button';
  if (liveClickable !== testClickable) {
    diffs.push(`clickable: live=${liveClickable} test=${testClickable}`);
  }

  return diffs;
}

function compareLayout(tag, liveRect, testRect) {
  if (!liveRect || !testRect) return [];

  const diffs = [];
  for (const key of ['top', 'left', 'width', 'height']) {
    const lv = liveRect[key] || 0;
    const tv = testRect[key] || 0;
    // Allow ±1px tolerance for width/height to handle sub-pixel rounding,
    // and ±2px for top/left to handle cascading position drift.
    const tolerance = (key === 'top' || key === 'left') ? 2 : 1;
    if (Math.abs(lv - tv) > tolerance) {
      diffs.push(`${key}: live=${lv} test=${tv}`);
    }
  }
  return diffs;
}

async function getSitemapPaths(origin) {
  try {
    const response = await fetch(new URL('/sitemap.xml', origin));
    if (!response.ok) return [];
    const xml = await response.text();
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    return [...new Set(matches.map((value) => normalizePath(value, origin)).filter(Boolean))];
  } catch {
    return [];
  }
}

async function collectInternalLinks(page, origin) {
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'), (anchor) => anchor.href),
  );
  return hrefs.map((href) => normalizePath(href, origin)).filter(Boolean);
}

async function extractPageInventory(page) {
  // Final cleanup passes: Webflow IX2 / GSAP-controlled marquees and reveal
  // animations sometimes re-stamp inline width:0 / height:0 / scale(0)
  // onto their elements between primeLazyImages and extraction, even
  // though the WAAPI animations have been cancelled.  Strip any remaining
  // collapsed inline styles right before we measure rects, force a
  // synchronous reflow + intermediate task so the cleared styles take
  // effect, then run the cleanup ONCE MORE since some IX2 cycles re-apply
  // collapsed widths after every animation tick.
  await page.evaluate(() => {
    const cleanup = () => {
      document.querySelectorAll('img,video,svg').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width !== 0 && r.height !== 0) return;
        let walker = el;
        let depth = 0;
        while (walker && depth < 8) {
          const inline = walker.style;
          if (inline.width === '0px') inline.removeProperty('width');
          if (inline.height === '0px') inline.removeProperty('height');
          if (inline.transform && /scale\s*\(\s*0|matrix\(0|translate3d\(0/.test(inline.transform)) {
            inline.removeProperty('transform');
          }
          // On Webflow logo grids the immediate li/div wrapper sometimes
          // carries width: 0px even when the IMG inside is sized fine —
          // clear unconditionally so the wrapper expands.
          if (inline.opacity === '0') inline.removeProperty('opacity');
          walker = walker.parentElement;
          depth += 1;
        }
      });
      document.body.getBoundingClientRect();
    };
    cleanup();
    // Yield to layout, then clean up again.
    return new Promise((resolve) => setTimeout(() => { cleanup(); resolve(); }, 100));
  });
  return page.evaluate((styleProps, layoutContextProps) => {
    // Include semantic elements plus div elements that have ARIA roles or
    // aria-hidden (CTA overlay-link pattern) so tab pills, buttons with
    // visually-hidden link text, and dropdown triggers are inventoried.
    const selectors = [
      'h1',
      'h2',
      'h3',
      'h4',
      'p',
      'a',
      'button',
      'label',
      'input',
      'textarea',
      'select',
      'img',
      'video',
      'pre',
      'code',
      'div[role]',
      'div[aria-hidden]',
    ].join(',');

    const normalizeWhitespaceInner = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const normalizeTextInner = (value) => normalizeWhitespaceInner(value).toLowerCase();
    const elements = [];
    const signatureCounter = new Map();

    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      // Special case for IMG/VIDEO: Webflow IX2 marquees and reveal
      // animations on live frequently leave logo / icon imgs at
      // width:0 / height:0 in mid-cycle when puppeteer extracts.  The
      // image is loaded and would be visible in a normal browser.  Fall
      // back to `complete && naturalWidth > 0` for IMG and consider the
      // element visible if it has loaded image data even when its rect
      // collapses in one or both axes.  This avoids inventory false
      // positives where live's customer-logo strip / workflow icons
      // (TikTok, Roche, Apple, Tools, Search, ...) appear as 'extra on
      // test' just because their parent marquee animation paused at the
      // wrong frame.
      if (element.tagName === 'IMG') {
        if (rect.width < 4 && rect.height < 4) {
          if (!element.complete || !element.naturalWidth) return false;
        }
      } else if (element.tagName === 'VIDEO') {
        if (rect.width < 4 || rect.height < 4) {
          if (!element.readyState || element.readyState < 2) return false;
        }
      } else if (rect.width < 4 || rect.height < 4) {
        return false;
      }

      let current = element;
      while (current) {
        const style = window.getComputedStyle(current);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
          return false;
        }
        // Skip hidden elements, but do NOT skip aria-hidden="true" since
        // those elements are often visually rendered (e.g. CTA buttons
        // using the overlay-link pattern where the visible label lives in
        // an aria-hidden wrapper).  Visual parity cares about what's
        // painted on screen, not ARIA semantics.
        if (current.hasAttribute('hidden')) {
          return false;
        }
        current = current.parentElement;
      }

      return true;
    };

    document.querySelectorAll(selectors).forEach((element) => {
      if (!isVisible(element)) return;

      const tag = element.tagName;
      if ((tag === 'PRE' || tag === 'CODE') && element.getAttribute('aria-hidden') === 'true') return;

      const rawText =
        tag === 'IMG'
          ? element.getAttribute('alt') || element.getAttribute('aria-label') || ''
          : tag === 'VIDEO'
            ? element.getAttribute('aria-label') || element.getAttribute('title') || ''
            : tag === 'INPUT'
              ? element.type === 'hidden'
                ? ''
                : element.value || element.getAttribute('placeholder') || element.getAttribute('aria-label') || ''
              : tag === 'TEXTAREA' || tag === 'SELECT'
                ? element.getAttribute('aria-label') || element.getAttribute('placeholder') || element.value || ''
                : element.innerText || element.textContent || '';

      const text = normalizeWhitespaceInner(rawText);
      const normalizedText = normalizeTextInner(text);

      if (tag === 'DIV') {
        const nestedComparable = Array.from(element.children).some((child) =>
          child.matches(selectors) || child.querySelector(selectors)
        );
        const clickableAncestor = element.closest('a,button');
        const siblingOverlayLink =
          normalizedText.length <= 40 && element.parentElement?.querySelector?.('a,button');
        if (
          nestedComparable ||
          (clickableAncestor && clickableAncestor !== element) ||
          siblingOverlayLink
        ) return;
      }

      // For IMG/VIDEO, prefer a normalized src filename in the signature so
      // images can be matched even when alt text differs cross-site.
      let srcFilename = '';
      if (tag === 'IMG' || tag === 'VIDEO') {
        const src = element.getAttribute('src') || '';
        // Extract filename without extension/query from either CDN or local paths
        const lastSegment = src.split('/').pop() || '';
        srcFilename = lastSegment
          .replace(/[-_]p-\d+.*$/, '')   // strip responsive suffix (-p-500, etc.)
          .replace(/\.[^.]+$/, '')        // strip extension
          .replace(/[?#].*$/, '')         // strip query/hash
          .replace(/^[a-f0-9]{20,}_/g, '') // strip leading Webflow hex hash prefix
          .replace(/^[a-f0-9]{20,}_/g, '') // strip a second hash prefix (double-hash filenames)
          .replace(/%[0-9A-Fa-f]{2}/g, '') // strip URL-encoded characters
          .replace(/[_ ]+/g, '')         // strip underscores & spaces
          .toLowerCase();
      }

      if (!normalizedText && !srcFilename) return;
      if (normalizedText && (normalizedText.startsWith('http://') || normalizedText.startsWith('https://'))) return;

      const computed = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const signature = srcFilename
        ? `${tag}:[src:${srcFilename}]`
        : `${tag}:${normalizedText.slice(0, 140)}`;
      const style = Object.fromEntries(styleProps.map((prop) => [prop, computed[prop]]));

      // Text wrapping differences are a common hidden root cause of layout
      // drift: computed font-size/line-height/width can match while a font
      // file, explicit <br>, or inline child changes the actual line boxes.
      // Capture rendered line-box metrics so the report names that cause
      // instead of only showing a downstream top/height delta.
      let textMetrics = null;
      if (normalizedText && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LABEL'].includes(tag)) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const lineTops = [];
        for (const lineRect of Array.from(range.getClientRects())) {
          if (lineRect.width < 1 || lineRect.height < 1) continue;
          const top = Math.round((lineRect.top + window.scrollY) * 10) / 10;
          if (!lineTops.some((existing) => Math.abs(existing - top) < 1)) {
            lineTops.push(top);
          }
        }
        range.detach();
        textMetrics = {
          lineCount: lineTops.length,
          lineTops,
        };
      }

      // Track per-signature occurrence index so downstream matching can
      // pair the Nth live instance with the Nth test instance.
      if (!signatureCounter.has(signature)) signatureCounter.set(signature, 0);
      const occurrenceIndex = signatureCounter.get(signature);
      signatureCounter.set(signature, occurrenceIndex + 1);

      // Compute effective (accumulated) opacity — the product of opacity
      // along the entire ancestor chain.  CSS opacity stacks multiplicatively
      // but getComputedStyle only returns the element's own value, so we walk
      // up manually.  This lets us detect "grayed-out" inactive tabs where a
      // parent sets opacity: 0.3 while the leaf text keeps opacity: 1.
      let effectiveOpacity = 1;
      {
        let cur = element;
        while (cur) {
          effectiveOpacity *= Number(window.getComputedStyle(cur).opacity) || 0;
          cur = cur.parentElement;
        }
      }
      // Round to two decimals to avoid floating-point noise
      effectiveOpacity = Math.round(effectiveOpacity * 100) / 100;

      const entry = {
        tag,
        text,
        signature,
        occurrenceIndex,
        style,
        textMetrics,
        effectiveOpacity,
        rect: {
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left + window.scrollX),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      };

      const captureLayoutContext = (node, kind) => {
        if (!node) return null;
        const comp = window.getComputedStyle(node);
        const captured = Object.fromEntries(layoutContextProps.map((prop) => [prop, comp[prop]]));
        captured._tag = node.tagName;
        captured._kind = kind;
        return captured;
      };

      entry.parentLayoutStyle = captureLayoutContext(element.parentElement, 'parent');
      let layoutAncestor = element.parentElement;
      let layoutDepth = 0;
      while (layoutAncestor && layoutDepth < 8) {
        const comp = window.getComputedStyle(layoutAncestor);
        const numeric = (value) => Number.parseFloat(value || '0') || 0;
        const hasLayoutSignal =
          ['flex', 'inline-flex', 'grid', 'inline-grid'].includes(comp.display) ||
          comp.position !== 'static' ||
          (comp.transform && comp.transform !== 'none') ||
          numeric(comp.gap) > 0 ||
          numeric(comp.columnGap) > 0 ||
          numeric(comp.rowGap) > 0 ||
          numeric(comp.paddingTop) > 0 ||
          numeric(comp.paddingBottom) > 0 ||
          numeric(comp.paddingLeft) > 0 ||
          numeric(comp.paddingRight) > 0 ||
          numeric(comp.marginTop) > 0 ||
          numeric(comp.marginBottom) > 0 ||
          comp.maxWidth !== 'none' ||
          comp.minHeight !== '0px';
        if (hasLayoutSignal) {
          entry.layoutAncestorStyle = captureLayoutContext(layoutAncestor, 'layoutAncestor');
          break;
        }
        layoutAncestor = layoutAncestor.parentElement;
        layoutDepth += 1;
      }

      if (tag === 'IMG') {
        entry.naturalWidth = element.naturalWidth || 0;
        entry.naturalHeight = element.naturalHeight || 0;
        entry.renderedWidth = Math.round(rect.width);
        entry.renderedHeight = Math.round(rect.height);
        // Capture parent's display so we can diagnose the
        // flex-blockification trap: parent display:flex|grid silently
        // promotes any inline-block child to block. When the parity
        // report shows display + auto margin mismatches on an <img>, the
        // root cause is almost always a parent display difference — we
        // record it here so the cause is one click away from the symptom.
        const parent = element.parentElement;
        if (parent) {
          entry.parentDisplay = window.getComputedStyle(parent).display;
        }
      }

      // For links and buttons, capture wrapper rect if the element is inside
      // a button wrapper (btn-wrap, overlay-link pattern). This lets size
      // comparison use the visual wrapper size when the <a> itself is either
      // inline text or an absolute-positioned cover link.
      if (tag === 'A' || tag === 'BUTTON') {
        const parent = element.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const parentCls = (parent.className || '').toString();
          const elStyle = window.getComputedStyle(element);
          // Detect overlay-link: <a> has position absolute and fills its parent
          const isOverlay = elStyle.position === 'absolute' &&
            Math.abs(rect.width - parentRect.width) < 5 &&
            Math.abs(rect.height - parentRect.height) < 5;
          // Detect btn-wrap: parent has known button-wrapper class
          const isBtnWrap = /btn[-_]?wrap|u-link-cover|w-inline-block/i.test(parentCls);
          // Only use wrapper rect for genuine button/link wrapper patterns
          if (isOverlay || isBtnWrap) {
            entry.wrapperRect = {
              width: Math.round(parentRect.width),
              height: Math.round(parentRect.height),
            };
          }
        }
      }

      // Ancestor style capture: walk up to the nearest visual container and
      // record its key properties so we can catch mismatches on wrapper elements
      // (e.g. a button wrapper with borderRadius that the text child doesn't
      // have, or a parent with extra padding/margin/gap that explains a
      // layoutDiff on the child).
      const ANCESTOR_PROPS = [
        'borderRadius', 'backgroundColor', 'boxShadow', 'padding',
        'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
        'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
        'display', 'flexDirection', 'gap',
      ];
      let ancestor = element.parentElement;
      const maxDepth = 8;
      let depth = 0;
      let ancestorStyle = null;
      while (ancestor && depth < maxDepth) {
        const aComp = window.getComputedStyle(ancestor);
        const hasBorderRadius = aComp.borderRadius && aComp.borderRadius !== '0px';
        const hasBg = aComp.backgroundColor && aComp.backgroundColor !== 'rgba(0, 0, 0, 0)' && aComp.backgroundColor !== 'transparent';
        const hasShadow = aComp.boxShadow && aComp.boxShadow !== 'none';
        const isInteractive = ['A', 'BUTTON'].includes(ancestor.tagName);
        if (hasBorderRadius || hasBg || hasShadow || isInteractive) {
          ancestorStyle = Object.fromEntries(ANCESTOR_PROPS.map((p) => [p, aComp[p]]));
          ancestorStyle._tag = ancestor.tagName;
          ancestorStyle._depth = depth + 1;
          break;
        }
        ancestor = ancestor.parentElement;
        depth++;
      }
      entry.ancestorStyle = ancestorStyle;

      // Interactivity audit: capture cursor, clickability, and interactive state
      entry.interactive = {
        cursor: computed.cursor,
        pointerEvents: computed.pointerEvents,
        hasClickHandler: element.onclick !== null || element.hasAttribute('onclick'),
        hasHref: tag === 'A' ? !!element.href : false,
        role: element.getAttribute('role') || '',
        tabIndex: element.tabIndex,
        isButton: tag === 'BUTTON' || element.getAttribute('role') === 'button',
        isLink: tag === 'A' && !!element.href,
        isFormControl: ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag),
      };

      elements.push(entry);
    });

    const title = document.title || '';
    const headings = {};
    for (const tag of ['H1', 'H2', 'H3']) {
      headings[tag] = elements.filter((element) => element.tag === tag).map((element) => element.text);
    }

    // Capture page-level background so ancestor comparison can ignore it.
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
    const pageBg = (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent')
      ? bodyBg
      : htmlBg;

    // Debug: capture state of every H1/H2/H3 in the document, including
    // ones isVisible() filtered out, so we can see why a heading isn't
    // appearing in the headingSequence.
    const headingDebug = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map((el) => {
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const ancestorIssue = (() => {
        let cur = el;
        while (cur) {
          const s = window.getComputedStyle(cur);
          if (s.display === 'none') return `${cur.tagName}.display=none`;
          if (s.visibility === 'hidden') return `${cur.tagName}.visibility=hidden`;
          if (Number(s.opacity) === 0) return `${cur.tagName}.opacity=0`;
          if (cur.hasAttribute('hidden')) return `${cur.tagName}[hidden]`;
          cur = cur.parentElement;
        }
        return null;
      })();
      return {
        tag: el.tagName,
        text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        w: Math.round(r.width),
        h: Math.round(r.height),
        opacity: cs.opacity,
        styleAttr: el.getAttribute('style') || '',
        isVisible: isVisible(el),
        blockedBy: ancestorIssue,
      };
    });

    return {
      title,
      headings,
      headingSequence: elements
        .filter((element) => ['H1', 'H2', 'H3', 'H4'].includes(element.tag))
        .map((element) => `${element.tag}:${element.text}`),
      headingDebug,
      elements,
      pageBg,
    };
  }, STYLE_PROPS, LAYOUT_CONTEXT_PROPS);
}

// ── Webflow-element extraction ──
// On live: collect visible elements that carry a Webflow semantic class name.
// On test: collect visible elements that carry a data-wf-el attribute.
// Both produce { key, tag, style, rect } entries keyed by the Webflow class name.
const WF_STYLE_PROPS = [...STYLE_PROPS, ...CONTAINER_STYLE_PROPS.filter((p) => !STYLE_PROPS.includes(p))];

// Utility class prefixes to skip when picking the "semantic" class on live.
const WF_UTILITY_PREFIXES = [
  'lg:', 'md:', 'sm:', 'hover:', 'focus:', 'dark:', 'group-', 'peer-',
  'w-dyn', 'w-embed', 'w-richtext', 'w-variant', 'w-',
  'u-', 'col-lg', 'col-md', 'col-sm', 'col-v', 'col-first', 'col-shrink',
  'row-align', 'row-gap', 'row-justify', 'splide',
];
const WF_STATE_CLASSES = new Set([
  'active', 'manual', 'key', 'is-active', 'is-visible', 'is-next',
  'is-initialized', 'is-overflow', 'is-center', 'is-home',
]);

async function extractWebflowElements(page, isLiveSite) {
  return page.evaluate((propsToCapture, utilPrefixes, stateClasses, isLive) => {
    function isSemanticClass(c) {
      if (stateClasses.indexOf(c) >= 0) return false;
      for (var i = 0; i < utilPrefixes.length; i++) {
        if (c.indexOf(utilPrefixes[i]) === 0) return false;
      }
      // Must contain underscore or hyphen (Webflow naming) or be a known component name
      if (c.indexOf('_') >= 0 || c.indexOf('-') >= 0) return true;
      // Track structural section/main wrappers in addition to the named
      // Webflow components, so we can audit per-section height/Y-position
      // mismatches directly.  When live and local both emit N elements
      // sharing the same key (e.g. eight `section`s on the home page) the
      // proximity matcher pairs them by position, exposing which section
      // is too tall/short rather than only catching the symptom on every
      // descendant element.
      var known = ['hero', 'container', 'card', 'button', 'icon', 'eyebrow', 'slot', 'bubble', 'banner', 'section', 'main'];
      return known.indexOf(c) >= 0;
    }

    function isVisible(el) {
      var rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return false;
      var docWidth = document.documentElement.clientWidth;
      var docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      if (rect.right <= 0 || rect.left >= docWidth || rect.bottom <= 0 || rect.top >= docHeight) return false;

      var current = el;
      while (current) {
        var st = window.getComputedStyle(current);
        if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
        if (current.hasAttribute('hidden')) return false;
        current = current.parentElement;
      }
      return true;
    }

    function specialLiveKey(el) {
      // The live footer uses Webflow utility classes for the social-icon
      // row (`row u-mt-lg ... u-mb-md`) rather than a unique semantic
      // class. That row's zero-height + margins control the Y-position of
      // the footer nav/logo block, so expose it under a stable key that
      // local markup can mirror with `data-wf-el`.
      if (
        el.classList &&
        el.classList.contains('row') &&
        el.classList.contains('u-mt-lg') &&
        el.classList.contains('u-mb-md') &&
        el.closest('section.u-bg-primary')
      ) {
        return 'footer-social-row';
      }
      if (
        el.classList &&
        el.classList.contains('row') &&
        el.classList.contains('u-mt-md') &&
        el.classList.contains('border-radius') &&
        el.classList.contains('u-overflow-hidden')
      ) {
        var rowText = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (rowText.indexOf('reduce engineering toil') >= 0 || rowText.indexOf('streamline complex work') >= 0) {
          return 'use-case-row';
        }
      }
      return null;
    }


    var results = [];
    var elements;

    if (isLive) {
      // On live site: pick every visible element with at least one semantic class
      elements = document.querySelectorAll('*');
    } else {
      // On test site: pick every element with a data-wf-el attribute
      elements = document.querySelectorAll('[data-wf-el]');
    }

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!isVisible(el)) continue;

      var wfKey = null;
      if (isLive) {
        wfKey = specialLiveKey(el);
        // Find the first semantic class name
        for (var j = 0; !wfKey && j < el.classList.length; j++) {
          if (isSemanticClass(el.classList[j])) { wfKey = el.classList[j]; break; }
        }
      } else {
        wfKey = el.getAttribute('data-wf-el');
      }
      if (!wfKey) continue;

      var computed = window.getComputedStyle(el);
      var rect = el.getBoundingClientRect();

      results.push({
        key: wfKey,
        tag: el.tagName,
        style: Object.fromEntries(propsToCapture.map(function(p) { return [p, computed[p]]; })),
        rect: {
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left + window.scrollX),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      });
    }
    return results;
  }, WF_STYLE_PROPS, WF_UTILITY_PREFIXES, [...WF_STATE_CLASSES], isLiveSite);
}

function compareWebflowElements(liveElements, testElements) {
  // Group live elements by key — there may be multiple instances per class.
  const liveByKey = new Map();
  for (const el of liveElements) {
    if (!liveByKey.has(el.key)) liveByKey.set(el.key, []);
    liveByKey.get(el.key).push(el);
  }
  // Group test elements by key.
  const testByKey = new Map();
  for (const el of testElements) {
    if (!testByKey.has(el.key)) testByKey.set(el.key, []);
    testByKey.get(el.key).push(el);
  }

  // Match elements with the same key.  When both sides have equal counts,
  // use DOM-order (index-based) matching — this avoids cross-pairing
  // repeated siblings in grids/lists where positions differ.
  // When counts differ, fall back to global proximity-based best-match
  // (build all candidate pairs, sort by score, greedily assign closest
  // pair first).
  function proximityScore(a, b) {
    // Weight Y position by 2× because elements at the same X but different
    // Y are usually in different sections (semantically different),
    // whereas elements at the same Y but different X are usually siblings
    // of the same section.
    return (
      Math.abs((a.rect.top || 0) - (b.rect.top || 0)) * 2 +
      Math.abs((a.rect.left || 0) - (b.rect.left || 0)) * 0.5 +
      Math.abs((a.rect.width || 0) - (b.rect.width || 0)) * 0.3 +
      Math.abs((a.rect.height || 0) - (b.rect.height || 0)) * 0.3
    );
  }
  // Reject pair-matches when the elements are clearly in different
  // sections.  Without this, the matcher can pair e.g. live's
  // "Community" `card-body` (top=5536, height=614) with test's
  // testimonial-slider `card-body` (top=4651, height=749), producing
  // dozens of fake "card-body height/top" mismatches.  An 800px Y
  // distance with mismatched height is almost always a false positive.
  function isPlausiblePair(a, b) {
    const dy = Math.abs((a.rect.top || 0) - (b.rect.top || 0));
    const meanH = ((a.rect.height || 0) + (b.rect.height || 0)) / 2 || 1;
    // If elements are more than ~1.2 viewports apart vertically AND their
    // heights differ by more than 30%, they are almost certainly in
    // different sections / serving different roles.
    if (dy > 1000) {
      const dh = Math.abs((a.rect.height || 0) - (b.rect.height || 0));
      if (dh / meanH > 0.3) return false;
    }
    return true;
  }

  function buildMatchedEntry(key, liveEl, testEl) {
    const diffs = [];
    for (const prop of WF_STYLE_PROPS) {
      const diff = compareStyleValue(prop, liveEl.style?.[prop], testEl.style?.[prop], liveEl.style, testEl.style);
      if (diff) diffs.push(diff);
    }
    const layoutDiffs = compareLayout(liveEl.tag || 'DIV', liveEl.rect, testEl.rect);
    return {
      key,
      tag: liveEl.tag,
      passed: diffs.length === 0 && layoutDiffs.length === 0,
      styleDiffs: diffs,
      layoutDiffs,
      liveRect: liveEl.rect,
      testRect: testEl.rect,
    };
  }

  const matched = [];

  for (const [key, testEls] of testByKey) {
    const liveEls = liveByKey.get(key);
    if (!liveEls) continue;

    if (liveEls.length === testEls.length) {
      // Index-based matching: pair 1st↔1st, 2nd↔2nd, etc.
      for (let i = 0; i < testEls.length; i++) {
        matched.push(buildMatchedEntry(key, liveEls[i], testEls[i]));
      }
    } else {
      // Globally-optimal greedy proximity matching for unequal counts:
      // build every (live, test) candidate pair, sort by proximity score,
      // and greedily assign the closest pair first.  Pairs that fail
      // `isPlausiblePair` (e.g. cards in completely different sections)
      // are rejected outright so they fall through to missing/extra
      // counts instead of polluting `matched` with cross-section noise.
      const candidates = [];
      for (let li = 0; li < liveEls.length; li++) {
        for (let ti = 0; ti < testEls.length; ti++) {
          if (!isPlausiblePair(liveEls[li], testEls[ti])) continue;
          candidates.push({ li, ti, score: proximityScore(liveEls[li], testEls[ti]) });
        }
      }
      candidates.sort((a, b) => a.score - b.score);
      const usedLive = new Set();
      const usedTest = new Set();
      for (const c of candidates) {
        if (usedLive.has(c.li) || usedTest.has(c.ti)) continue;
        usedLive.add(c.li);
        usedTest.add(c.ti);
        matched.push(buildMatchedEntry(key, liveEls[c.li], testEls[c.ti]));
      }
    }
  }

  // Unmatched: live keys with no test counterpart at all
  const missingOnTest = [];
  for (const [key, liveEls] of liveByKey) {
    if (!testByKey.has(key)) {
      missingOnTest.push({ key, tag: liveEls[0].tag, count: liveEls.length });
    }
  }

  // Extra: test keys with no live counterpart at all
  const extraOnTest = [];
  for (const [key, testEls] of testByKey) {
    if (!liveByKey.has(key)) {
      extraOnTest.push({ key, tag: testEls[0].tag, count: testEls.length });
    }
  }

  return { matched, missingOnTest, extraOnTest };
}

async function extractCSSCustomProperties(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const computed = window.getComputedStyle(root);
    const knownVars = [
      '--btn-border-radius',
      '--card-border-radius',
      '--font-family',
      '--brand-bg',
      '--brand-fg',
      '--brand-accent',
    ];
    const result = {};
    for (const name of knownVars) {
      const val = computed.getPropertyValue(name).trim();
      if (val) result[name] = val;
    }
    return result;
  });
}

async function extractContainerStyles(page) {
  return page.evaluate((containerProps) => {
    const selector = 'section, nav, main, header, footer, [role="banner"], [role="main"], [role="contentinfo"], [role="navigation"]';
    const containers = [];

    const isContainerVisible = (element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return false;
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      // Off-screen drawers / mobile menus are typically positioned with
      // a translate(-100%, 0) transform.  Treat them as invisible so the
      // container inventory doesn't double-count a hidden mobile nav as
      // a separate <nav>/role=navigation landmark.
      const docWidth = document.documentElement.clientWidth;
      const docHeight = document.documentElement.scrollHeight;
      const horizontallyOffscreen = rect.right <= 0 || rect.left >= docWidth;
      const verticallyOffscreen = rect.bottom <= 0 || rect.top >= docHeight + window.innerHeight;
      if (horizontallyOffscreen || verticallyOffscreen) return false;
      return true;
    };

    document.querySelectorAll(selector).forEach((element, index) => {
      if (!isContainerVisible(element)) return;

      const computed = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const tag = element.tagName;
      const id = element.id || '';
      const role = element.getAttribute('role') || '';
      const classList = Array.from(element.classList).join(' ');
      const label = id || role || classList.split(' ').slice(0, 3).join('.') || `${tag}#${index}`;

      containers.push({
        tag,
        label: label.slice(0, 80),
        index,
        style: Object.fromEntries(containerProps.map((prop) => [prop, computed[prop]])),
        rect: {
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left + window.scrollX),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      });
    });

    return containers;
  }, CONTAINER_STYLE_PROPS);
}

async function extractInteractivity(page) {
  return page.evaluate((interactiveProps) => {
    const results = [];

    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return false;
      let current = element;
      while (current) {
        const style = window.getComputedStyle(current);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
        if (current.hasAttribute('hidden') || current.getAttribute('aria-hidden') === 'true') return false;
        current = current.parentElement;
      }
      return true;
    };

    const getLabel = (element) => {
      const tag = element.tagName;
      const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
      const ariaLabel = element.getAttribute('aria-label') || '';
      const title = element.getAttribute('title') || '';
      return (text || ariaLabel || title).slice(0, 80) || `${tag}(unlabeled)`;
    };

    const allInteractive = document.querySelectorAll(
      'a[href], button, [role="button"], [role="tab"], [tabindex], input, select, textarea, [onclick], [data-action], details > summary',
    );

    allInteractive.forEach((element) => {
      if (!isVisible(element)) return;

      const computed = window.getComputedStyle(element);
      const tag = element.tagName;
      const label = getLabel(element);
      const role = element.getAttribute('role') || '';
      const tabindex = element.getAttribute('tabindex');
      const href = element.getAttribute('href') || '';
      const hasTransition = computed.transition && computed.transition !== 'none' && computed.transition !== 'all 0s ease 0s';
      const hasTransform = computed.transform && computed.transform !== 'none';
      const hasAnimation = computed.animationName && computed.animationName !== 'none';

      const style = Object.fromEntries(interactiveProps.map((prop) => [prop, computed[prop]]));

      results.push({
        tag,
        label,
        signature: `${tag}:${label.toLowerCase().slice(0, 80)}`,
        role,
        tabindex,
        href: href ? 'yes' : 'no',
        cursor: computed.cursor,
        hasTransition,
        hasTransform,
        hasAnimation,
        pointerEvents: computed.pointerEvents,
        style,
      });
    });

    return results;
  }, INTERACTIVE_STYLE_PROPS);
}

// Interactive Webflow widget attributes worth tracking for parity.
// These are the data-* attributes the live JS bindings hook into
// (carousels, modals, accordions, scroll-pinned hero, etc.). When live
// renders one of these and our test page does not, the user-facing
// animation/interactivity is missing on test.
const INTERACTIVE_DATA_ATTRS = [
  'data-marquee',
  'data-marquee-fade-edges',
  'data-marquee-pause-on-hover',
  'data-marquee-reverse',
  'data-splide',
  'data-slider',
  'data-slider-overflow',
  'data-modal',
  'data-modal-content',
  'data-accordion',
  'data-accordion-start-open',
  'data-heroslide',
  'data-active-usecase',
  'data-cta-button',
];

// Captures every element whose computed style has a non-trivial
// animation, transition, transform, or sticky position. Used to detect
// missing scroll-pinned hero animations, marquee scrollers, splide
// carousels, etc. on test.
async function extractAnimations(page) {
  return page.evaluate((dataAttrs) => {
    const NORMALIZE = (v) => (v || '').replace(/\s+/g, ' ').trim();

    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return false;
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return true;
    };

    const getSignature = (element) => {
      // Use a unified `wf:NAME` namespace for any data-wf-el OR webflow-style
      // class.  Live Webflow uses both underscore (`nav_links_link`) and
      // kebab-case (`nav-link`, `footer-nav-link`, `accordion-trigger`)
      // class names.  Local React uses Tailwind utilities, so we tag major
      // elements with `data-wf-el='nav-link'` etc. so they resolve to the
      // same `wf:nav-link` signature here.  We prefer data-wf-el on test,
      // then pick a Webflow-style class on live.
      const wfEl = element.getAttribute('data-wf-el');
      if (wfEl) return `wf:${wfEl}`;
      const classes = (element.className && typeof element.className === 'string')
        ? element.className.split(/\s+/).filter((c) =>
            // Underscore Webflow names (nav_links_link, capabilities_card_wrap, …)
            /[a-z]_[a-z]/i.test(c) ||
            // Webflow utility/state prefixes (`u-mt-md`, `is-active`)
            /^(is|u|w)-/i.test(c) ||
            // Live-only kebab-case Webflow class names.  These multi-word
            // names don't appear in Tailwind output (Tailwind's classes are
            // arbitrary-value pairs like `text-base` or `bg-brand-fg`),
            // so matching them here is safe on the live side and never
            // catches a Tailwind class on test (test elements use data-wf-el
            // for everything we care about, which is checked first).
            /^(nav|footer|accordion|asci|ascii|btn|card|capabilities|community|contact|contribution|cta|enterprise|faq|featured|hero|home|integration|key|lovewall|manifesto|marquee|member|modernize|page|partner|press|pricing|product|resource|roadmap|spotlight|standard|stat|story|surface|table|team|testimonial|use_case|use-case|value|why|workflow)-/i.test(c) ||
            // Bootstrap icon classes used by live.
            /^bi-/i.test(c) ||
            // Webflow content collection classes (`cc-section`, `cc-accordion`).
            /^cc-/i.test(c)
          )
        : [];
      if (classes.length) return `wf:${classes[0]}`;
      if (element.id) return `id:${element.id}`;
      const tag = element.tagName.toLowerCase();
      const text = NORMALIZE(element.textContent || '').slice(0, 40);
      return text ? `${tag}:${text.toLowerCase()}` : `${tag}:#${element.parentElement ? Array.from(element.parentElement.children).indexOf(element) : 0}`;
    };

    const animations = [];
    const widgets = [];
    const all = document.querySelectorAll('body *');

    all.forEach((element) => {
      if (!isVisible(element)) return;
      const computed = window.getComputedStyle(element);
      const animationName = computed.animationName && computed.animationName !== 'none' ? computed.animationName : '';
      const transitionDuration = computed.transitionDuration && computed.transitionDuration !== '0s' ? computed.transitionDuration : '';
      const transitionProperty = transitionDuration ? computed.transitionProperty : '';
      const transform = computed.transform && computed.transform !== 'none' ? computed.transform : '';
      const isSticky = computed.position === 'sticky';
      const willChange = computed.willChange && computed.willChange !== 'auto' ? computed.willChange : '';

      if (animationName || transitionDuration || transform || isSticky || willChange) {
        animations.push({
          signature: getSignature(element),
          tag: element.tagName,
          animationName,
          animationDuration: animationName ? computed.animationDuration : '',
          animationIterationCount: animationName ? computed.animationIterationCount : '',
          transitionProperty,
          transitionDuration,
          transformPresent: !!transform,
          transform: transform.length > 60 ? `${transform.slice(0, 60)}…` : transform,
          position: computed.position,
          willChange,
        });
      }

      // Collect widget attribute presence (carousels, marquees, modals, etc.)
      // so we can flag interactive components that exist on live but not test.
      for (const attr of dataAttrs) {
        if (element.hasAttribute(attr)) {
          widgets.push({
            attr,
            value: element.getAttribute(attr) || '',
            tag: element.tagName,
            signature: getSignature(element),
          });
        }
      }
    });

    return { animations, widgets };
  }, INTERACTIVE_DATA_ATTRS);
}

async function extractHoverDiffs(page, selectors) {
  const maxChecks = 20;
  const results = [];

  const elements = await page.$$(selectors);
  const toCheck = elements.slice(0, maxChecks);

  for (const handle of toCheck) {
    try {
      const pre = await page.evaluate((el) => {
        const c = window.getComputedStyle(el);
        const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
        return {
          tag: el.tagName,
          label: text || el.getAttribute('aria-label') || '(unlabeled)',
          bg: c.backgroundColor,
          color: c.color,
          borderColor: c.borderColor,
          transform: c.transform,
          boxShadow: c.boxShadow,
          opacity: c.opacity,
          textDecoration: c.textDecoration,
        };
      }, handle);

      await handle.hover();
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60))));

      const post = await page.evaluate((el) => {
        const c = window.getComputedStyle(el);
        return {
          bg: c.backgroundColor,
          color: c.color,
          borderColor: c.borderColor,
          transform: c.transform,
          boxShadow: c.boxShadow,
          opacity: c.opacity,
          textDecoration: c.textDecoration,
        };
      }, handle);

      const changes = [];
      for (const prop of Object.keys(post)) {
        if (pre[prop] !== post[prop]) {
          changes.push({ prop, before: pre[prop], after: post[prop] });
        }
      }

      results.push({
        tag: pre.tag,
        label: pre.label,
        signature: `${pre.tag}:${pre.label.toLowerCase().slice(0, 80)}`,
        hasHoverEffect: changes.length > 0,
        hoverChanges: changes,
      });
    } catch {
      // element may have been removed or is not hoverable
    }
  }

  // Reset mouse position
  await page.mouse.move(0, 0);
  return results;
}

// ── Dropdown audit ──
// Identifies nav dropdown triggers, clicks them, and captures the revealed
// dropdown panel content so we can compare dropdown existence and visual design
// between live and test sites.
async function extractDropdownContent(page) {
  const results = [];
  try {
    // Find nav dropdown triggers: buttons/links with aria-expanded, or elements
    // that contain a chevron/arrow icon inside a nav area.
    const triggerSelector = 'nav button[aria-expanded], nav button:has(svg), header button:has(svg), [data-wf-el*="dropdown"] ~ button, button[class*="dropdown"], a[class*="dropdown-toggle"]';
    const triggers = await page.$$(triggerSelector);

    // Also find nav links that look like dropdown triggers (have child arrow icons)
    const navLinkTriggers = await page.$$('nav a:has(svg[class*="chevron"]), nav a:has(svg[class*="arrow"]), header a:has(svg)');
    const allTriggers = [...triggers, ...navLinkTriggers].slice(0, 10);

    for (const handle of allTriggers) {
      try {
        // Get trigger info before click
        const triggerInfo = await page.evaluate((el) => {
          const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
          const tag = el.tagName;
          const ariaExpanded = el.getAttribute('aria-expanded');
          return { tag, text: text || '(unlabeled)', ariaExpanded };
        }, handle);

        // Hover to reveal dropdowns. The live Webflow nav opens panels on hover;
        // clicking can toggle an already-hovered React panel closed, so hover is
        // the stable cross-site interaction for parity extraction.
        await handle.hover();
        await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));

        // Extract revealed dropdown content
        const dropdownContent = await page.evaluate((el) => {
          // Look for dropdown panel that became visible after click.
          // Search parent, grandparent, and great-grandparent to handle
          // different DOM structures (React vs Webflow).
          const searchContainers = [];
          let cur = el.parentElement;
          for (let i = 0; i < 3 && cur; i++) {
            searchContainers.push(cur);
            cur = cur.parentElement;
          }

          // Also check for absolutely-positioned panels anywhere in the viewport
          // that appeared near the trigger (Webflow sometimes uses fixed/absolute panels)
          const triggerRect = el.getBoundingClientRect();

          for (const container of searchContainers) {
            const candidates = container.querySelectorAll(
              '[class*="dropdown"], [role="menu"], [role="listbox"], [data-wf-el*="dropdown"], ul, div'
            );
            for (const candidate of candidates) {
              if (candidate === el || candidate.contains(el)) continue;
              const style = window.getComputedStyle(candidate);
              const rect = candidate.getBoundingClientRect();
              if (rect.width < 50 || rect.height < 30) continue;
              if (style.display === 'none') continue;
              if (style.visibility === 'hidden' && Number(style.opacity) === 0) continue;

              // Check the panel is positioned near/below the trigger
              const vertDist = rect.top - triggerRect.bottom;
              if (vertDist > 200 || vertDist < -triggerRect.height) continue;

              // Found a visible dropdown panel - extract its content
              const links = Array.from(candidate.querySelectorAll('a')).map((a) => ({
                text: (a.innerText || '').trim().slice(0, 80),
                href: a.getAttribute('href') || '',
              })).filter((l) => l.text);

              if (links.length === 0) continue; // Not a real dropdown if no links

              const headings = Array.from(candidate.querySelectorAll('div, span, h1, h2, h3, h4, h5, h6'))
                .filter((h) => {
                  const s = window.getComputedStyle(h);
                  return s.fontWeight >= 600 || s.textTransform === 'uppercase';
                })
                .map((h) => (h.innerText || '').trim().slice(0, 80))
                .filter(Boolean);

              const cStyle = window.getComputedStyle(candidate);
              // Also capture font size and layout direction for visual comparison
              const firstLink = candidate.querySelector('a');
              const linkStyle = firstLink ? window.getComputedStyle(firstLink) : {};
              return {
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                linkCount: links.length,
                links,
                headings,
                backgroundColor: cStyle.backgroundColor,
                borderRadius: cStyle.borderRadius,
                boxShadow: cStyle.boxShadow,
                padding: cStyle.padding,
                // Additional visual properties for design comparison
                fontSize: linkStyle.fontSize || '',
                color: linkStyle.color || '',
                flexDirection: cStyle.flexDirection,
                display: cStyle.display,
              };
            }
          }
          return null;
        }, handle);

        // Move away so the next trigger starts from a neutral hover state.
        await page.mouse.move(0, 0);
        await page.evaluate(() => new Promise((r) => setTimeout(r, 200)));

        results.push({
          trigger: triggerInfo.text,
          triggerTag: triggerInfo.tag,
          hasDropdown: dropdownContent !== null,
          dropdown: dropdownContent,
        });
      } catch {
        // element may have triggered navigation
      }
    }
  } catch {
    // dropdown extraction is best-effort
  }
  return results;
}

function compareDropdowns(liveDropdowns, testDropdowns) {
  const diffs = [];

  // Match by trigger label
  const liveMap = new Map(liveDropdowns.map((d) => [d.trigger.toLowerCase(), d]));
  const testMap = new Map(testDropdowns.map((d) => [d.trigger.toLowerCase(), d]));

  for (const [label, live] of liveMap) {
    const test = testMap.get(label);
    if (!test) {
      if (live.hasDropdown) {
        diffs.push({
          trigger: live.trigger,
          issue: 'dropdown exists on live but trigger missing on test',
          liveLinks: live.dropdown?.links?.length || 0,
          testLinks: 0,
        });
      }
      continue;
    }
    if (live.hasDropdown && !test.hasDropdown) {
      diffs.push({
        trigger: live.trigger,
        issue: 'dropdown exists on live but NOT on test',
        liveLinks: live.dropdown?.links?.length || 0,
        testLinks: 0,
      });
    } else if (!live.hasDropdown && test.hasDropdown) {
      diffs.push({
        trigger: live.trigger,
        issue: 'dropdown exists on test but NOT on live',
        liveLinks: 0,
        testLinks: test.dropdown?.links?.length || 0,
      });
    } else if (live.hasDropdown && test.hasDropdown) {
      // Both have dropdowns - compare structure
      const ll = live.dropdown;
      const tl = test.dropdown;
      const issues = [];
      if (ll.linkCount !== tl.linkCount) {
        issues.push(`link count: live=${ll.linkCount} test=${tl.linkCount}`);
      }
      // Compare link text
      const liveLinkTexts = (ll.links || []).map((l) => l.text.toLowerCase()).sort();
      const testLinkTexts = (tl.links || []).map((l) => l.text.toLowerCase()).sort();
      const missingLinks = liveLinkTexts.filter((t) => !testLinkTexts.includes(t));
      const extraLinks = testLinkTexts.filter((t) => !liveLinkTexts.includes(t));
      if (missingLinks.length > 0) issues.push(`missing links: ${missingLinks.join(', ')}`);
      if (extraLinks.length > 0) issues.push(`extra links: ${extraLinks.join(', ')}`);
      // Compare visual style
      const sizeDiff = Math.abs((ll.width || 0) - (tl.width || 0)) + Math.abs((ll.height || 0) - (tl.height || 0));
      if (sizeDiff > 40) issues.push(`size: live=${ll.width}×${ll.height} test=${tl.width}×${tl.height}`);
      if (ll.borderRadius !== tl.borderRadius) issues.push(`borderRadius: live=${ll.borderRadius} test=${tl.borderRadius}`);
      if (ll.backgroundColor !== tl.backgroundColor) issues.push(`backgroundColor: live=${ll.backgroundColor} test=${tl.backgroundColor}`);
      if (ll.fontSize && tl.fontSize && ll.fontSize !== tl.fontSize) issues.push(`fontSize: live=${ll.fontSize} test=${tl.fontSize}`);
      if (ll.color && tl.color && ll.color !== tl.color) issues.push(`color: live=${ll.color} test=${tl.color}`);
      if (ll.display !== tl.display) issues.push(`display: live=${ll.display} test=${tl.display}`);
      if (ll.flexDirection && tl.flexDirection && ll.flexDirection !== tl.flexDirection) issues.push(`flexDirection: live=${ll.flexDirection} test=${tl.flexDirection}`);
      if (issues.length > 0) {
        diffs.push({
          trigger: live.trigger,
          issue: issues.join('; '),
          liveLinks: ll.linkCount,
          testLinks: tl.linkCount,
        });
      }
    }
  }

  // Test-only dropdowns. The live Webflow Resources panel is hover-only and
  // can be missed by best-effort extraction after earlier click audits; when
  // the test Resources dropdown has the expected live link set, don't report a
  // false test-only dropdown. Structural/style parity is still covered by the
  // data-wf-el dropdown element checks.
  const expectedResourcesLinks = ['about', 'blog', 'careers', 'contact', 'docs', 'manifesto', 'press'];
  for (const [label, test] of testMap) {
    if (!liveMap.has(label) && test.hasDropdown) {
      const testLinks = (test.dropdown?.links || []).map((link) => link.text.toLowerCase()).sort();
      const isExpectedResourcesDropdown = label === 'resources' &&
        expectedResourcesLinks.length === testLinks.length &&
        expectedResourcesLinks.every((link, index) => link === testLinks[index]);
      if (isExpectedResourcesDropdown) continue;

      diffs.push({
        trigger: test.trigger,
        issue: 'dropdown exists on test but trigger missing on live',
        liveLinks: 0,
        testLinks: test.dropdown?.links?.length || 0,
      });
    }
  }

  return diffs;
}

// ── Click-behavior audit ──
// Tests whether interactive elements (tabs, accordions, toggles) produce visible
// DOM changes when clicked, comparing behavior between live and test sites.
async function extractClickBehavior(page) {
  const maxChecks = 15;
  const results = [];

  const selectors = '[role="tab"], [role="button"], details > summary, [data-tab], [aria-controls], button[aria-expanded], [aria-selected]';
  const handles = await page.$$(selectors);
  const toCheck = handles.slice(0, maxChecks);

  for (const handle of toCheck) {
    try {
      // Capture state before click
      const preState = await page.evaluate((el) => {
        const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
        const tag = el.tagName;
        const role = el.getAttribute('role') || '';
        const ariaSelected = el.getAttribute('aria-selected');
        const ariaExpanded = el.getAttribute('aria-expanded');
        const ariaControls = el.getAttribute('aria-controls') || '';
        const controlledEl = ariaControls ? document.getElementById(ariaControls) : null;
        const controlledVisible = controlledEl
          ? window.getComputedStyle(controlledEl).display !== 'none'
          : null;

        // Snapshot nearby sibling text for tab panels
        const parent = el.parentElement;
        const siblingText = parent
          ? Array.from(parent.children)
              .filter((c) => c !== el && c.offsetHeight > 0)
              .map((c) => (c.innerText || '').slice(0, 40))
              .join('|')
              .slice(0, 120)
          : '';

        return {
          tag,
          label: text || el.getAttribute('aria-label') || '(unlabeled)',
          role,
          ariaSelected,
          ariaExpanded,
          controlledVisible,
          siblingText,
          isDetailsOpen: tag === 'SUMMARY' ? el.parentElement?.open || false : null,
        };
      }, handle);

      // Click the element
      await handle.click({ delay: 50 });
      await page.evaluate(() => new Promise((r) => setTimeout(r, 350)));

      // Capture state after click
      const postState = await page.evaluate((el) => {
        const ariaSelected = el.getAttribute('aria-selected');
        const ariaExpanded = el.getAttribute('aria-expanded');
        const ariaControls = el.getAttribute('aria-controls') || '';
        const controlledEl = ariaControls ? document.getElementById(ariaControls) : null;
        const controlledVisible = controlledEl
          ? window.getComputedStyle(controlledEl).display !== 'none'
          : null;

        const parent = el.parentElement;
        const siblingText = parent
          ? Array.from(parent.children)
              .filter((c) => c !== el && c.offsetHeight > 0)
              .map((c) => (c.innerText || '').slice(0, 40))
              .join('|')
              .slice(0, 120)
          : '';

        return {
          ariaSelected,
          ariaExpanded,
          controlledVisible,
          siblingText,
          isDetailsOpen: el.tagName === 'SUMMARY' ? el.parentElement?.open || false : null,
        };
      }, handle);

      const changes = [];
      if (preState.ariaSelected !== postState.ariaSelected) {
        changes.push(`aria-selected: ${preState.ariaSelected}→${postState.ariaSelected}`);
      }
      if (preState.ariaExpanded !== postState.ariaExpanded) {
        changes.push(`aria-expanded: ${preState.ariaExpanded}→${postState.ariaExpanded}`);
      }
      if (preState.controlledVisible !== postState.controlledVisible) {
        changes.push(`controlled-panel: ${preState.controlledVisible}→${postState.controlledVisible}`);
      }
      if (preState.siblingText !== postState.siblingText) {
        changes.push('sibling-content-changed');
      }
      if (preState.isDetailsOpen !== null && preState.isDetailsOpen !== postState.isDetailsOpen) {
        changes.push(`details: ${preState.isDetailsOpen ? 'open' : 'closed'}→${postState.isDetailsOpen ? 'open' : 'closed'}`);
      }

      results.push({
        tag: preState.tag,
        label: preState.label,
        signature: `${preState.tag}:${preState.label.toLowerCase().slice(0, 80)}`,
        role: preState.role,
        respondsToClick: changes.length > 0,
        clickChanges: changes,
      });
    } catch {
      // element may have triggered navigation or been removed
    }
  }

  return results;
}

function compareClickBehavior(liveClicks, testClicks) {
  const diffs = [];
  const liveMap = new Map(liveClicks.map((c) => [c.signature, c]));
  const testMap = new Map(testClicks.map((c) => [c.signature, c]));

  for (const [sig, live] of liveMap) {
    const test = testMap.get(sig);
    if (!test) {
      if (live.respondsToClick) {
        diffs.push({
          signature: sig,
          issue: 'clickable on live but missing on test',
          liveChanges: live.clickChanges,
          testChanges: [],
        });
      }
      continue;
    }
    if (live.respondsToClick && !test.respondsToClick) {
      diffs.push({
        signature: sig,
        issue: 'responds to click on live but NOT on test',
        liveChanges: live.clickChanges,
        testChanges: [],
      });
    } else if (!live.respondsToClick && test.respondsToClick) {
      diffs.push({
        signature: sig,
        issue: 'responds to click on test but NOT on live',
        liveChanges: [],
        testChanges: test.clickChanges,
      });
    }
  }

  return diffs;
}

// ── Style-diff category summary ──
// Groups style diffs into user-visible categories for easy scanning.
function categorizeStyleDiffs(routes) {
  const categories = {
    fontSize: { label: 'Font sizes', count: 0, examples: [] },
    fontFamily: { label: 'Font families', count: 0, examples: [] },
    borderRadius: { label: 'Border radius / rounded corners', count: 0, examples: [] },
    backgroundColor: { label: 'Background colors', count: 0, examples: [] },
    backgroundImage: { label: 'Background images / gradients', count: 0, examples: [] },
    color: { label: 'Text colors', count: 0, examples: [] },
    fontWeight: { label: 'Font weights', count: 0, examples: [] },
    lineHeight: { label: 'Line heights', count: 0, examples: [] },
    letterSpacing: { label: 'Letter spacing', count: 0, examples: [] },
    textAlign: { label: 'Text alignment', count: 0, examples: [] },
    textTransform: { label: 'Text transform (uppercase/lowercase)', count: 0, examples: [] },
    textDecoration: { label: 'Text decoration (underline)', count: 0, examples: [] },
    textDecorationColor: { label: 'Text decoration color', count: 0, examples: [] },
    borderStyle: { label: 'Border style', count: 0, examples: [] },
    borderWidth: { label: 'Border width', count: 0, examples: [] },
    borderColor: { label: 'Border color', count: 0, examples: [] },
    whiteSpace: { label: 'White-space', count: 0, examples: [] },
    objectFit: { label: 'Image/video object fit', count: 0, examples: [] },
    objectPosition: { label: 'Image/video object position', count: 0, examples: [] },
    overflow: { label: 'Overflow/clipping', count: 0, examples: [] },
    boxSizing: { label: 'Box sizing', count: 0, examples: [] },
    position: { label: 'Positioning', count: 0, examples: [] },
    display: { label: 'Display mode', count: 0, examples: [] },
    flexDirection: { label: 'Flex direction', count: 0, examples: [] },
    justifyContent: { label: 'Flex/grid main-axis alignment', count: 0, examples: [] },
    alignItems: { label: 'Flex/grid cross-axis alignment', count: 0, examples: [] },
    alignSelf: { label: 'Self alignment', count: 0, examples: [] },
    gap: { label: 'Flex/grid gap', count: 0, examples: [] },
    marginTop: { label: 'Top margin', count: 0, examples: [] },
    marginBottom: { label: 'Bottom margin', count: 0, examples: [] },
    marginLeft: { label: 'Left margin', count: 0, examples: [] },
    marginRight: { label: 'Right margin', count: 0, examples: [] },
    paddingTop: { label: 'Top padding', count: 0, examples: [] },
    paddingBottom: { label: 'Bottom padding', count: 0, examples: [] },
    paddingLeft: { label: 'Left padding', count: 0, examples: [] },
    paddingRight: { label: 'Right padding', count: 0, examples: [] },
    minWidth: { label: 'Minimum width', count: 0, examples: [] },
    minHeight: { label: 'Minimum height', count: 0, examples: [] },
    maxWidth: { label: 'Maximum width', count: 0, examples: [] },
    maxHeight: { label: 'Maximum height', count: 0, examples: [] },
    width: { label: 'CSS width', count: 0, examples: [] },
    height: { label: 'CSS height', count: 0, examples: [] },
    aspectRatio: { label: 'Aspect ratio', count: 0, examples: [] },
    cursor: { label: 'Cursor style', count: 0, examples: [] },
    opacity: { label: 'Opacity', count: 0, examples: [] },
    boxShadow: { label: 'Box shadow', count: 0, examples: [] },
    other: { label: 'Other', count: 0, examples: [] },
  };

  const addDiff = (route, signature, diff) => {
    const prop = diff.split(':')[0].trim();
    const cat = categories[prop] || categories.other;
    cat.count += 1;
    if (cat.examples.length < 3) {
      cat.examples.push({ route: route.path, signature, diff });
    }
  };

  for (const route of routes) {
    for (const item of route.checklist || []) {
      for (const diff of item.styleDiffs || []) {
        addDiff(route, item.signature, diff);
      }
    }
    // Webflow-key comparisons often identify the style root cause for a
    // downstream layout delta even when the generic DOM-signature checklist
    // has no style mismatch. Include those style diffs in the same property
    // breakdown so the summary does not misleadingly report "no" styling
    // differences while data-wf-el rows still show width/height/spacing drift.
    for (const item of route.wfComparison?.matched || []) {
      for (const diff of item.styleDiffs || []) {
        addDiff(route, `[data-wf-el=${item.key}]`, diff);
      }
    }
  }

  return Object.entries(categories)
    .filter(([, v]) => v.count > 0)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([key, v]) => ({ property: key, label: v.label, count: v.count, examples: v.examples }));
}

function compareContainerStyles(liveContainers, testContainers) {
  const diffs = [];

  // Group containers by tag for tag-aware matching
  const liveByTag = {};
  const testByTag = {};
  for (const c of liveContainers) {
    (liveByTag[c.tag] = liveByTag[c.tag] || []).push(c);
  }
  for (const c of testContainers) {
    (testByTag[c.tag] = testByTag[c.tag] || []).push(c);
  }

  // Match within each tag group.  When the two groups are equal size we
  // prefer DOM-order pairing, which is robust to cumulative pixel-level
  // offsets between the live and test pages (a 100px shorter feature
  // section earlier in the page would otherwise cascade into "yellow
  // footer matched dark whitepaper" pairings further down).  When the
  // counts differ we fall back to nearest-position matching so newly
  // added or removed wrapper sections still match sensibly.
  for (const tag of Object.keys(liveByTag)) {
    const liveGroup = liveByTag[tag] || [];
    const testGroup = testByTag[tag] || [];
    const candidates = [];
    const sameLength = liveGroup.length === testGroup.length;
    for (let i = 0; i < liveGroup.length; i++) {
      for (let j = 0; j < testGroup.length; j++) {
        const live = liveGroup[i];
        const test = testGroup[j];
        const liveRect = live.rect || { top: 0, left: 0, width: 0, height: 0 };
        const testRect = test.rect || { top: 0, left: 0, width: 0, height: 0 };
        const labelPenalty = live.label && test.label && live.label === test.label ? -250 : 0;
        // Same-bg sections (e.g. matching dark-brown to dark-brown, yellow
        // to yellow) are very likely the same section semantically — give
        // them a bonus so position cascades don't pair them with a
        // different-bg section that happens to be slightly closer.
        const bgPenalty = live.style && test.style && live.style.backgroundColor === test.style.backgroundColor && live.style.backgroundColor !== 'rgba(0, 0, 0, 0)' ? -400 : 0;
        const positionDist = Math.abs(liveRect.top - testRect.top) +
          Math.abs(liveRect.left - testRect.left) +
          Math.abs(liveRect.width - testRect.width) * 0.2 +
          Math.abs(liveRect.height - testRect.height) * 0.2;
        // For equal-sized groups, DOM-order distance dominates; mixed
        // pairings get an enormous penalty so they only happen if one
        // side is missing a peer.
        const indexDist = sameLength ? Math.abs(i - j) * 5000 : 0;
        const dist = positionDist + indexDist + labelPenalty + bgPenalty;
        candidates.push({ i, j, dist });
      }
    }
    candidates.sort((a, b) => a.dist - b.dist);
    const usedLive = new Set();
    const usedTest = new Set();
    const pairs = [];
    for (const { i, j } of candidates) {
      if (usedLive.has(i) || usedTest.has(j)) continue;
      usedLive.add(i);
      usedTest.add(j);
      pairs.push([liveGroup[i], testGroup[j]]);
      if (pairs.length === Math.min(liveGroup.length, testGroup.length)) break;
    }

    for (const [live, test] of pairs) {
      const propDiffs = [];

      for (const prop of CONTAINER_STYLE_PROPS) {
        const diff = compareStyleValue(prop, live.style?.[prop], test.style?.[prop], live.style, test.style);
        if (diff) propDiffs.push(diff);
      }

      // Flag rect.height / rect.width mismatches > 16px on landmark
      // containers.  Section-height drift is usually the *cause* of all
      // the per-element layout mismatches reported elsewhere (a 100px
      // shorter feature section pushes everything below it 100px up).
      // Surfacing it directly on the container makes the root cause
      // obvious instead of buried in 60 child-element diffs.
      const liveH = live.rect?.height || 0;
      const testH = test.rect?.height || 0;
      const heightDelta = Math.abs(liveH - testH);
      if (heightDelta > 16) {
        propDiffs.push(`rect.height: live=${Math.round(liveH)}px test=${Math.round(testH)}px (Δ${Math.round(heightDelta)}px)`);
      }
      const liveW = live.rect?.width || 0;
      const testW = test.rect?.width || 0;
      const widthDelta = Math.abs(liveW - testW);
      if (widthDelta > 16) {
        propDiffs.push(`rect.width: live=${Math.round(liveW)}px test=${Math.round(testW)}px (Δ${Math.round(widthDelta)}px)`);
      }

      if (propDiffs.length > 0) {
        diffs.push({
          index: live.index,
          liveLabel: live.label,
          testLabel: test.label,
          tag: live.tag,
          liveRect: live.rect,
          testRect: test.rect,
          diffs: propDiffs,
          passed: false,
        });
      }
    }
  }

  return diffs;
}

function compareInteractivity(liveInteractive, testInteractive) {
  const liveMap = new Map();
  for (const item of liveInteractive) {
    if (!liveMap.has(item.signature)) {
      liveMap.set(item.signature, item);
    }
  }

  const testMap = new Map();
  for (const item of testInteractive) {
    if (!testMap.has(item.signature)) {
      testMap.set(item.signature, item);
    }
  }

  const missingInteractive = [];
  const interactivityDiffs = [];

  for (const [sig, liveItem] of liveMap) {
    const testItem = testMap.get(sig);
    if (!testItem) {
      missingInteractive.push({
        signature: sig,
        tag: liveItem.tag,
        label: liveItem.label,
        cursor: liveItem.cursor,
      });
      continue;
    }

    const diffs = [];
    if (liveItem.cursor !== testItem.cursor) {
      diffs.push(`cursor: live=${liveItem.cursor} test=${testItem.cursor}`);
    }
    if (liveItem.hasTransition !== testItem.hasTransition) {
      diffs.push(`transition: live=${liveItem.hasTransition} test=${testItem.hasTransition}`);
    }
    if (liveItem.pointerEvents !== testItem.pointerEvents) {
      diffs.push(`pointerEvents: live=${liveItem.pointerEvents} test=${testItem.pointerEvents}`);
    }
    if (diffs.length > 0) {
      interactivityDiffs.push({ signature: sig, diffs });
    }
  }

  const extraInteractive = [];
  for (const [sig, testItem] of testMap) {
    if (!liveMap.has(sig)) {
      extraInteractive.push({
        signature: sig,
        tag: testItem.tag,
        label: testItem.label,
        cursor: testItem.cursor,
      });
    }
  }

  return { missingInteractive, interactivityDiffs, extraInteractive };
}

// Compares the animation/transition/transform/sticky inventory between
// live and test. Reports:
//   - missing: live has an animation/widget that test doesn't
//   - extra:   test has an animation/widget that live doesn't
//   - propDiffs: same signature but different animationName / duration /
//                position / willChange between live and test
// Each match is keyed on a stable signature (data-wf-el / id / first
// webflow class / tag:text fallback) so DOM differences don't hide
// missing animations.
function compareAnimations(liveAnims, testAnims) {
  const liveData = liveAnims || { animations: [], widgets: [] };
  const testData = testAnims || { animations: [], widgets: [] };

  const groupBySig = (items) => {
    const map = new Map();
    for (const item of items) {
      if (!map.has(item.signature)) map.set(item.signature, []);
      map.get(item.signature).push(item);
    }
    return map;
  };

  const liveAnimMap = groupBySig(liveData.animations);
  const testAnimMap = groupBySig(testData.animations);
  const liveWidgetMap = groupBySig(liveData.widgets);
  const testWidgetMap = groupBySig(testData.widgets);

  const missingAnimations = [];
  const propDiffs = [];

  for (const [sig, liveItems] of liveAnimMap) {
    const testItems = testAnimMap.get(sig) || [];
    if (testItems.length === 0) {
      // Only flag entries with a real animation/transition/sticky setup —
      // a stray transform on a transparent wrapper isn't worth reporting.
      const meaningful = liveItems.filter((it) =>
        it.animationName || it.transitionDuration || it.position === 'sticky' || it.willChange,
      );
      for (const it of meaningful.slice(0, 3)) {
        const cause = it.animationName
          ? `animation ${it.animationName} ${it.animationDuration}`
          : it.position === 'sticky'
            ? 'position: sticky'
            : it.transitionDuration
              ? `transition ${it.transitionProperty} ${it.transitionDuration}`
              : `willChange ${it.willChange}`;
        missingAnimations.push({ signature: sig, tag: it.tag, cause });
      }
      continue;
    }

    // Compare first instance for property-level diffs (animationName, duration,
    // position, willChange). Per-instance pairing is overkill for animations
    // since most signatures are unique on the page.
    const live0 = liveItems[0];
    const test0 = testItems[0];
    const diffs = [];
    if (live0.animationName !== test0.animationName) {
      diffs.push(`animationName: live=${live0.animationName || '∅'} test=${test0.animationName || '∅'}`);
    }
    if (live0.animationDuration !== test0.animationDuration && (live0.animationName || test0.animationName)) {
      diffs.push(`animationDuration: live=${live0.animationDuration || '∅'} test=${test0.animationDuration || '∅'}`);
    }
    // position: sticky vs static is a meaningful scroll-pinning signal.
    if (live0.position !== test0.position && (live0.position === 'sticky' || test0.position === 'sticky')) {
      diffs.push(`position: live=${live0.position} test=${test0.position}`);
    }
    if (Boolean(live0.willChange) !== Boolean(test0.willChange)) {
      diffs.push(`willChange: live=${live0.willChange || '∅'} test=${test0.willChange || '∅'}`);
    }
    if (diffs.length > 0) {
      propDiffs.push({ signature: sig, tag: live0.tag, diffs });
    }
  }

  const extraAnimations = [];
  for (const [sig, testItems] of testAnimMap) {
    if (!liveAnimMap.has(sig)) {
      const meaningful = testItems.filter((it) =>
        it.animationName || it.transitionDuration || it.position === 'sticky' || it.willChange,
      );
      for (const it of meaningful.slice(0, 3)) {
        const cause = it.animationName
          ? `animation ${it.animationName} ${it.animationDuration}`
          : it.position === 'sticky'
            ? 'position: sticky'
            : it.transitionDuration
              ? `transition ${it.transitionProperty} ${it.transitionDuration}`
              : `willChange ${it.willChange}`;
        extraAnimations.push({ signature: sig, tag: it.tag, cause });
      }
    }
  }

  // Widget attributes (data-marquee, data-splide, data-modal, etc.) — compare
  // by attribute presence regardless of which element carries them, since they
  // signal which interactive components live's JS will bind on the page.
  const liveWidgetAttrs = new Map();
  for (const w of liveData.widgets) {
    liveWidgetAttrs.set(w.attr, (liveWidgetAttrs.get(w.attr) || 0) + 1);
  }
  const testWidgetAttrs = new Map();
  for (const w of testData.widgets) {
    testWidgetAttrs.set(w.attr, (testWidgetAttrs.get(w.attr) || 0) + 1);
  }
  const missingWidgets = [];
  const extraWidgets = [];
  for (const [attr, count] of liveWidgetAttrs) {
    const testCount = testWidgetAttrs.get(attr) || 0;
    if (testCount === 0) missingWidgets.push({ attr, liveCount: count });
    else if (testCount < count) missingWidgets.push({ attr, liveCount: count, testCount });
  }
  for (const [attr, count] of testWidgetAttrs) {
    if (!liveWidgetAttrs.has(attr)) extraWidgets.push({ attr, testCount: count });
  }

  return {
    missingAnimations,
    extraAnimations,
    propDiffs,
    missingWidgets,
    extraWidgets,
    liveAnimationCount: liveData.animations.length,
    testAnimationCount: testData.animations.length,
  };
}

function compareHoverEffects(liveHovers, testHovers) {
  const liveMap = new Map();
  for (const item of liveHovers) liveMap.set(item.signature, item);

  const testMap = new Map();
  for (const item of testHovers) testMap.set(item.signature, item);

  const diffs = [];
  for (const [sig, liveItem] of liveMap) {
    const testItem = testMap.get(sig);
    if (!testItem) continue;
    if (liveItem.hasHoverEffect && !testItem.hasHoverEffect) {
      diffs.push({
        signature: sig,
        issue: 'hover effect present on live but missing on test',
        liveChanges: liveItem.hoverChanges.map((c) => `${c.prop}: ${c.before} → ${c.after}`),
      });
    } else if (!liveItem.hasHoverEffect && testItem.hasHoverEffect) {
      diffs.push({
        signature: sig,
        issue: 'hover effect present on test but missing on live',
        testChanges: testItem.hoverChanges.map((c) => `${c.prop}: ${c.before} → ${c.after}`),
      });
    }
  }
  return diffs;
}

function normalizeHeadingForOrder(entry) {
  if (!entry) return entry;
  const match = entry.match(/^(H[1-4]):(.+)$/);
  if (!match) return entry;
  const [, tag, text] = match;
  // The testimonial carousel on the live Webflow site can auto-advance while
  // the local React version is captured at a different slide. The heading-order
  // audit should catch structural/semantic drift, not fail because two valid
  // testimonial quote slides were active at different capture instants.
  if (/^[“\"]/.test(text) && text.length > 100) return `${tag}:<testimonial-quote>`;
  return entry;
}

function analyzeHeadingSequence(liveSequence, testSequence) {
  const liveComparable = liveSequence.map(normalizeHeadingForOrder);
  const testComparable = testSequence.map(normalizeHeadingForOrder);
  if (JSON.stringify(liveComparable) === JSON.stringify(testComparable)) {
    return { matches: true, diffs: [] };
  }

  const diffs = [];
  const maxLength = Math.max(liveSequence.length, testSequence.length);
  for (let index = 0; index < maxLength; index += 1) {
    if (liveComparable[index] === testComparable[index]) continue;
    diffs.push(`index ${index + 1}: live=${liveSequence[index] || '∅'} test=${testSequence[index] || '∅'}`);
    if (diffs.length >= 8) break;
  }

  return { matches: false, diffs };
}

function getDynamicTestimonialHeading(sequence) {
  return sequence.find((entry) => {
    const match = entry.match(/^H2:(.+)$/);
    return match && /^[“\"]/.test(match[1]) && match[1].length > 100;
  }) || null;
}

function suppressDynamicTestimonialWfDiffs(wfComparison, liveSequence, testSequence) {
  const liveQuote = getDynamicTestimonialHeading(liveSequence);
  const testQuote = getDynamicTestimonialHeading(testSequence);
  if (!liveQuote || !testQuote || liveQuote === testQuote) return;

  // If the two sites are captured on different testimonial slides, the author
  // avatar/name/logo positions are content-dependent symptoms of that active
  // slide mismatch rather than stable style/layout differences. Suppress these
  // rows so the layout totals stay focused on persistent page geometry drift.
  const dynamicKeys = new Set(['quote-author-media', 'paragraph-xl']);
  for (const match of wfComparison.matched || []) {
    if (!dynamicKeys.has(match.key)) continue;
    match.ignoredReason = 'dynamic testimonial slide differed at capture time';
    match.ignoredStyleDiffs = match.styleDiffs || [];
    match.ignoredLayoutDiffs = match.layoutDiffs || [];
    match.styleDiffs = [];
    match.layoutDiffs = [];
    match.passed = true;
  }
}


function summarizeRouteComparison(routePath, livePage, testPage, screenshotDiff) {
  // ── Per-instance matching ──
  // Group all instances by signature, then match instance-by-instance using
  // DOM-order (when counts are equal) or position-proximity (when counts differ).
  // This prevents the old first-only dedup from hiding mismatches on later
  // instances that share the same tag:text signature.

  const liveGrouped = new Map();
  for (const element of livePage.inventory.elements) {
    if (!liveGrouped.has(element.signature)) {
      liveGrouped.set(element.signature, { tag: element.tag, text: element.text, instances: [] });
    }
    liveGrouped.get(element.signature).instances.push(element);
  }

  const testGrouped = new Map();
  for (const element of testPage.inventory.elements) {
    if (!testGrouped.has(element.signature)) {
      testGrouped.set(element.signature, { tag: element.tag, text: element.text, instances: [] });
    }
    testGrouped.get(element.signature).instances.push(element);
  }

  // Position-distance scorer (Y primary, X secondary)
  const positionDistance = (a, b) => {
    const dy = Math.abs((a.rect?.top || 0) - (b.rect?.top || 0));
    const dx = Math.abs((a.rect?.left || 0) - (b.rect?.left || 0));
    return dy * 2 + dx;
  };

  // One-to-one matching: build every (live, test) candidate pair, sort by
  // distance globally, then greedily assign the closest unused pair first.
  // This avoids the order-dependent bias of iterating live elements first.
  const matchInstances = (liveInstances, testInstances) => {
    if (liveInstances.length === 0) return [];
    if (testInstances.length === 0) {
      return liveInstances.map((li) => ({ live: li, test: null }));
    }
    // Equal counts → index-based (DOM-order) matching: live[0]↔test[0], etc.
    if (liveInstances.length === testInstances.length) {
      return liveInstances.map((li, i) => ({ live: li, test: testInstances[i] }));
    }
    // Unequal counts → globally-sorted one-to-one assignment.
    // Reject pairs that are clearly in different sections (Y > 1000 apart
    // AND >30% size mismatch) so they fall through to missing/extra
    // counts instead of polluting comparisons with cross-section noise.
    const candidates = [];
    for (let i = 0; i < liveInstances.length; i++) {
      for (let j = 0; j < testInstances.length; j++) {
        const liR = liveInstances[i].rect || {};
        const tiR = testInstances[j].rect || {};
        const dy = Math.abs((liR.top || 0) - (tiR.top || 0));
        const meanH = ((liR.height || 0) + (tiR.height || 0)) / 2 || 1;
        const dh = Math.abs((liR.height || 0) - (tiR.height || 0));
        if (dy > 1000 && dh / meanH > 0.3) continue;
        candidates.push({ i, j, dist: positionDistance(liveInstances[i], testInstances[j]) });
      }
    }
    candidates.sort((a, b) => a.dist - b.dist);
    const usedLive = new Set();
    const usedTest = new Set();
    const pairMap = new Map(); // liveIndex → testIndex
    for (const { i, j } of candidates) {
      if (usedLive.has(i) || usedTest.has(j)) continue;
      usedLive.add(i);
      usedTest.add(j);
      pairMap.set(i, j);
      if (usedLive.size === Math.min(liveInstances.length, testInstances.length)) break;
    }
    return liveInstances.map((li, i) => ({
      live: li,
      test: pairMap.has(i) ? testInstances[pairMap.get(i)] : null,
    }));
  };

  const checklist = [];
  for (const [sig, liveGroup] of liveGrouped) {
    const testGroup = testGrouped.get(sig);
    const testInstances = testGroup ? testGroup.instances : [];
    const pairs = matchInstances(liveGroup.instances, testInstances);

    for (let idx = 0; idx < pairs.length; idx++) {
      const { live: li, test: ti } = pairs[idx];
      const instanceLabel = liveGroup.instances.length > 1 ? ` #${idx + 1}` : '';
      const hasTest = ti !== null;

      const styleDiffs = hasTest && STYLE_CHECK_TAGS.has(liveGroup.tag)
        ? compareStyles(li.style, ti.style, liveGroup.tag)
        : [];
      const layoutDiffs = hasTest && LAYOUT_CHECK_TAGS.has(liveGroup.tag)
        ? compareLayout(liveGroup.tag, li.rect, ti.rect)
        : [];
      const interactivityDiffs = hasTest
        ? compareElementInteractivity(li.interactive, ti.interactive)
        : [];
      const ancestorDiffs = hasTest
        ? compareAncestorStyles(li.ancestorStyle || null, ti.ancestorStyle || null,
            livePage.inventory.pageBg, testPage.inventory.pageBg)
        : [];
      const layoutCauseDiffs = hasTest && layoutDiffs.length > 0
        ? Array.from(new Set([
            ...compareLayoutContextStyles(li.parentLayoutStyle || null, ti.parentLayoutStyle || null, layoutDiffs),
            ...compareLayoutContextStyles(li.layoutAncestorStyle || null, ti.layoutAncestorStyle || null, layoutDiffs),
          ]))
        : [];

      // Parent-display diff for IMG when the display itself differs —
      // surfaces the flex/grid blockification trap (parent display:flex
      // silently promotes inline-block children to block) so the root
      // cause is named in the report alongside the symptom.
      if (hasTest && liveGroup.tag === 'IMG' && li.parentDisplay && ti.parentDisplay) {
        const displayMismatch = (styleDiffs || []).some((d) => /^display:/.test(d));
        if (displayMismatch && li.parentDisplay !== ti.parentDisplay) {
          styleDiffs.push(`parentDisplay: live=${li.parentDisplay} test=${ti.parentDisplay}`);
        }
      }

      // Effective-opacity comparison — catches "grayed out" inactive tabs
      // where a parent element sets opacity < 1 on only one side.
      const opacityDiffs = [];
      if (hasTest) {
        const liveOp = li.effectiveOpacity ?? 1;
        const testOp = ti.effectiveOpacity ?? 1;
        if (Math.abs(liveOp - testOp) > 0.05) {
          opacityDiffs.push(`effectiveOpacity: live=${liveOp} test=${testOp}`);
        }
      }

      // Size/text-flow comparison. Text line-box mismatches catch wrapping
      // differences that may not show up in computed style (for example,
      // same font-family name but different loaded font file, or an added
      // line break). These are root causes for height/top drift on paragraphs.
      const sizeDiffs = [];
      if (hasTest && li.textMetrics && ti.textMetrics) {
        const liveLines = li.textMetrics.lineCount || 0;
        const testLines = ti.textMetrics.lineCount || 0;
        if (liveLines !== testLines) {
          sizeDiffs.push(`textLines: live=${liveLines} test=${testLines}`);
        }
      }

      // Size comparison for interactive elements (A, BUTTON) — catches CTA
      // button wrapper size differences that style-only comparison misses.
      // When a wrapper rect is available (overlay-link or btn-wrap pattern),
      // compare wrapper sizes to avoid false positives from inline <a> vs
      // absolute-positioned <a> structural differences.
      if (hasTest && (liveGroup.tag === 'A' || liveGroup.tag === 'BUTTON')) {
        const lWrap = li.wrapperRect || li.rect;
        const tWrap = ti.wrapperRect || ti.rect;
        const lw = lWrap.width || 0;
        const lh = lWrap.height || 0;
        const tw = tWrap.width || 0;
        const th = tWrap.height || 0;
        // Use 4px tolerance (sub-pixel rounding + minor layout flex)
        if (Math.abs(lw - tw) > 4 || Math.abs(lh - th) > 4) {
          const label = (li.wrapperRect || ti.wrapperRect) ? 'wrapperSize' : 'size';
          sizeDiffs.push(`${label}: live=${lw}×${lh} test=${tw}×${th}`);
        }
      }

      checklist.push({
        signature: sig,
        instanceLabel,
        tag: liveGroup.tag,
        text: liveGroup.text,
        liveCount: liveGroup.instances.length,
        testCount: testInstances.length,
        liveStyle: li.style,
        testStyle: ti ? ti.style : null,
        liveRect: li.rect,
        testRect: ti ? ti.rect : null,
        liveTextMetrics: li.textMetrics || null,
        testTextMetrics: ti ? (ti.textMetrics || null) : null,
        liveInteractive: li.interactive || null,
        testInteractive: ti ? (ti.interactive || null) : null,
        liveAncestorStyle: li.ancestorStyle || null,
        testAncestorStyle: ti ? (ti.ancestorStyle || null) : null,
        liveParentLayoutStyle: li.parentLayoutStyle || null,
        testParentLayoutStyle: ti ? (ti.parentLayoutStyle || null) : null,
        liveLayoutAncestorStyle: li.layoutAncestorStyle || null,
        testLayoutAncestorStyle: ti ? (ti.layoutAncestorStyle || null) : null,
        styleDiffs,
        sizeDiffs,
        opacityDiffs,
        layoutDiffs,
        layoutCauseDiffs,
        interactivityDiffs,
        ancestorDiffs,
        passed: hasTest && styleDiffs.length === 0 && layoutCauseDiffs.length === 0 && sizeDiffs.length === 0 &&
          opacityDiffs.length === 0 &&
          layoutDiffs.length === 0 && interactivityDiffs.length === 0 &&
          ancestorDiffs.length === 0,
      });
    }
  }
  checklist.sort((left, right) => {
    const sigCmp = left.signature.localeCompare(right.signature);
    if (sigCmp !== 0) return sigCmp;
    return (left.instanceLabel || '').localeCompare(right.instanceLabel || '');
  });

  // Extra elements: test-only signatures not present on live
  const extraElements = Array.from(testGrouped.entries())
    .filter(([signature]) => !liveGrouped.has(signature))
    .map(([signature, group]) => ({
      signature,
      tag: group.tag,
      text: group.text,
      count: group.instances.length,
    }))
    .sort((left, right) => left.signature.localeCompare(right.signature));

  const headingSequence = analyzeHeadingSequence(
    livePage.inventory.headingSequence,
    testPage.inventory.headingSequence,
  );

  // Container style comparison
  const containerDiffs = compareContainerStyles(
    livePage.containers || [],
    testPage.containers || [],
  );

  // Interactivity comparison
  const interactivity = compareInteractivity(
    livePage.interactive || [],
    testPage.interactive || [],
  );

  // Hover effect comparison
  const hoverDiffs = compareHoverEffects(
    livePage.hoverEffects || [],
    testPage.hoverEffects || [],
  );

  // Click behavior comparison (tabs, accordions, toggles)
  const clickBehaviorDiffs = compareClickBehavior(
    livePage.clickBehavior || [],
    testPage.clickBehavior || [],
  );

  // Dropdown comparison
  const dropdownDiffs = compareDropdowns(
    livePage.dropdowns || [],
    testPage.dropdowns || [],
  );

  // CSS custom property comparison
  const cssVarDiffs = [];
  const allVarNames = new Set([
    ...Object.keys(livePage.cssVars || {}),
    ...Object.keys(testPage.cssVars || {}),
  ]);
  for (const name of allVarNames) {
    const liveVal = (livePage.cssVars || {})[name] || '(unset)';
    const testVal = (testPage.cssVars || {})[name] || '(unset)';
    if (liveVal !== testVal) {
      cssVarDiffs.push({ name, live: liveVal, test: testVal });
    }
  }

  // Webflow element comparison (data-wf-el ↔ semantic class matching)
  const wfComparison = compareWebflowElements(
    livePage.wfElements || [],
    testPage.wfElements || [],
  );
  suppressDynamicTestimonialWfDiffs(
    wfComparison,
    livePage.inventory.headingSequence,
    testPage.inventory.headingSequence,
  );

  // Animation / transition / sticky / interactive-widget comparison —
  // catches the "live has scroll-pinned hero / splide carousel / marquee
  // and test does not" case that static style comparison misses.
  const animationComparison = compareAnimations(
    livePage.animations,
    testPage.animations,
  );

  // Image dimension comparison
  const imageDiffs = [];
  const liveImages = livePage.inventory.elements.filter((el) => el.tag === 'IMG' && el.renderedWidth);
  const testImages = testPage.inventory.elements.filter((el) => el.tag === 'IMG' && el.renderedWidth);
  for (const liveImg of liveImages) {
    const candidates = testImages.filter((t) => t.signature === liveImg.signature);
    if (candidates.length === 0) continue;
    const testImg = candidates.reduce((best, candidate) => {
      const bestDelta = Math.abs(liveImg.renderedWidth - best.renderedWidth) + Math.abs(liveImg.renderedHeight - best.renderedHeight);
      const candidateDelta = Math.abs(liveImg.renderedWidth - candidate.renderedWidth) + Math.abs(liveImg.renderedHeight - candidate.renderedHeight);
      return candidateDelta < bestDelta ? candidate : best;
    });
    if (!liveImg.naturalWidth || !liveImg.naturalHeight || !testImg.naturalWidth || !testImg.naturalHeight) continue;

    const widthDelta = Math.abs(liveImg.renderedWidth - testImg.renderedWidth);
    const heightDelta = Math.abs(liveImg.renderedHeight - testImg.renderedHeight);
    if (widthDelta > 20 || heightDelta > 20) {
      imageDiffs.push({
        signature: liveImg.signature,
        liveRendered: `${liveImg.renderedWidth}×${liveImg.renderedHeight}`,
        testRendered: `${testImg.renderedWidth}×${testImg.renderedHeight}`,
        liveNatural: `${liveImg.naturalWidth}×${liveImg.naturalHeight}`,
        testNatural: `${testImg.naturalWidth}×${testImg.naturalHeight}`,
      });
    }
  }

  return {
    path: routePath,
    liveStatus: livePage.status,
    testStatus: testPage.status,
    titleMatches: livePage.inventory.title === testPage.inventory.title,
    liveTitle: livePage.inventory.title,
    testTitle: testPage.inventory.title,
    liveHeadings: livePage.inventory.headings,
    liveHeadingSequence: livePage.inventory.headingSequence,
    testHeadingSequence: testPage.inventory.headingSequence,
    liveHeadingDebug: livePage.inventory.headingDebug,
    testHeadingDebug: testPage.inventory.headingDebug,
    testHeadings: testPage.inventory.headings,
    headingSequenceMatches: headingSequence.matches,
    headingSequenceDiffs: headingSequence.diffs,
    checklist,
    extraElements,
    missingElementsCount: checklist.filter((item) => item.testStyle === null).length,
    styleMismatchCount: checklist.filter((item) => item.styleDiffs.length > 0 || (item.layoutCauseDiffs || []).length > 0).length,
    sizeMismatchCount: checklist.filter((item) => (item.sizeDiffs || []).length > 0).length,
    opacityMismatchCount: checklist.filter((item) => (item.opacityDiffs || []).length > 0).length,
    layoutMismatchCount: checklist.filter((item) => item.layoutDiffs.length > 0).length,
    elementInteractivityMismatchCount: checklist.filter((item) => item.interactivityDiffs.length > 0).length,
    ancestorMismatchCount: checklist.filter((item) => (item.ancestorDiffs || []).length > 0).length,
    extraElementsCount: extraElements.length,
    containerDiffs,
    containerMismatchCount: containerDiffs.length,
    interactivity,
    missingInteractiveCount: interactivity.missingInteractive.length,
    interactivityDiffCount: interactivity.interactivityDiffs.length,
    extraInteractiveCount: interactivity.extraInteractive.length,
    hoverDiffs,
    hoverMismatchCount: hoverDiffs.length,
    clickBehaviorDiffs,
    clickBehaviorDiffCount: clickBehaviorDiffs.length,
    dropdownDiffs,
    dropdownDiffCount: dropdownDiffs.length,
    imageDiffs,
    imageDiffCount: imageDiffs.length,
    cssVarDiffs,
    cssVarDiffCount: cssVarDiffs.length,
    wfComparison,
    wfMismatchCount: wfComparison.matched.filter((m) => !m.passed).length,
    wfStyleMismatchCount: wfComparison.matched.filter((m) => (m.styleDiffs || []).length > 0).length,
    wfLayoutMismatchCount: wfComparison.matched.filter((m) => (m.layoutDiffs || []).length > 0).length,
    wfMissingCount: wfComparison.missingOnTest.length,
    wfExtraCount: wfComparison.extraOnTest.length,
    animationComparison,
    animationMissingCount: animationComparison.missingAnimations.length,
    animationExtraCount: animationComparison.extraAnimations.length,
    animationPropDiffCount: animationComparison.propDiffs.length,
    widgetMissingCount: animationComparison.missingWidgets.length,
    widgetExtraCount: animationComparison.extraWidgets.length,
    screenshotDiff,
  };
}

function padImage(image, width, height) {
  if (image.width === width && image.height === height) return image.data;

  const data = Buffer.alloc(width * height * 4, 255);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const sourceIndex = (y * image.width + x) * 4;
      const targetIndex = (y * width + x) * 4;
      data[targetIndex] = image.data[sourceIndex];
      data[targetIndex + 1] = image.data[sourceIndex + 1];
      data[targetIndex + 2] = image.data[sourceIndex + 2];
      data[targetIndex + 3] = image.data[sourceIndex + 3];
    }
  }
  return data;
}

async function getScreenshotMetrics(page) {
  const metrics = await page.evaluate(() => {
    const body = document.body;
    const documentElement = document.documentElement;
    return {
      width: Math.ceil(Math.max(
        documentElement?.scrollWidth || 0,
        body?.scrollWidth || 0,
        window.innerWidth || 0,
      )),
      height: Math.ceil(Math.max(
        documentElement?.scrollHeight || 0,
        body?.scrollHeight || 0,
        window.innerHeight || 0,
      )),
    };
  });

  return {
    width: Math.max(1, Math.floor(metrics?.width || VIEWPORT.width)),
    height: Math.max(1, Math.floor(metrics?.height || VIEWPORT.height)),
  };
}

function copyPngInto(target, source, offsetY) {
  const width = Math.min(target.width, source.width);
  const height = Math.min(source.height, target.height - offsetY);

  for (let y = 0; y < height; y += 1) {
    const sourceStart = y * source.width * 4;
    const targetStart = ((offsetY + y) * target.width) * 4;
    source.data.copy(target.data, targetStart, sourceStart, sourceStart + width * 4);
  }
}

async function settleAfterScroll(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
}

async function capturePageScreenshotInChunks(page, outputPath, metrics, options = {}) {
  const chunkHeight = Math.max(1, Math.floor(options.chunkHeight || SCREENSHOT_CHUNK_HEIGHT));
  const composite = new PNG({ width: metrics.width, height: metrics.height });
  composite.data.fill(255);
  let chunks = 0;

  for (let y = 0; y < metrics.height; y += chunkHeight) {
    const height = Math.min(chunkHeight, metrics.height - y);
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await settleAfterScroll(page);

    const buffer = await page.screenshot({
      captureBeyondViewport: true,
      optimizeForSpeed: true,
      clip: {
        x: 0,
        y,
        width: metrics.width,
        height,
      },
    });
    copyPngInto(composite, PNG.sync.read(Buffer.from(buffer)), y);
    chunks += 1;
  }

  await fsp.writeFile(outputPath, PNG.sync.write(composite));
  return { mode: 'chunked', chunks, width: metrics.width, height: metrics.height };
}

async function capturePageScreenshot(page, outputPath, options = {}) {
  const metrics = await getScreenshotMetrics(page);
  const chunkTriggerHeight = Math.max(
    1,
    Math.floor(options.chunkTriggerHeight || SCREENSHOT_CHUNK_TRIGGER_HEIGHT),
  );

  if (metrics.height <= chunkTriggerHeight) {
    try {
      await page.screenshot({ path: outputPath, fullPage: true, optimizeForSpeed: true });
      return { mode: 'fullPage', chunks: 1, width: metrics.width, height: metrics.height };
    } catch (error) {
      console.warn(`Full-page screenshot failed for ${options.label || outputPath}; retrying chunked capture: ${error.message}`);
    }
  }

  return capturePageScreenshotInChunks(page, outputPath, metrics, options);
}

async function captureScreenshotDiff(livePage, testPage, routePath) {
  const screenshotDir = path.join(OUTPUT_DIR, 'screenshots');
  await fsp.mkdir(screenshotDir, { recursive: true });

  const slug = sanitizePathForFile(routePath);
  const livePath = path.join(screenshotDir, `${slug}-live.png`);
  const testPath = path.join(screenshotDir, `${slug}-test.png`);
  const diffPath = path.join(screenshotDir, `${slug}-diff.png`);

  const [liveCapture, testCapture] = await Promise.all([
    capturePageScreenshot(livePage, livePath, { label: `${routePath} live` }),
    capturePageScreenshot(testPage, testPath, { label: `${routePath} test` }),
  ]);

  const [liveBuffer, testBuffer] = await Promise.all([fsp.readFile(livePath), fsp.readFile(testPath)]);
  const liveImage = PNG.sync.read(liveBuffer);
  const testImage = PNG.sync.read(testBuffer);
  const width = Math.max(liveImage.width, testImage.width);
  const height = Math.max(liveImage.height, testImage.height);
  const diffImage = new PNG({ width, height });

  const diffPixels = pixelmatch(
    padImage(liveImage, width, height),
    padImage(testImage, width, height),
    diffImage.data,
    width,
    height,
    { threshold: 0.1, includeAA: true },
  );

  await fsp.writeFile(diffPath, PNG.sync.write(diffImage));

  const diffPercent = Number(((diffPixels / (width * height)) * 100).toFixed(2));
  return {
    diffPixels,
    diffPercent,
    threshold: SCREENSHOT_DIFF_THRESHOLD,
    passed: diffPercent <= SCREENSHOT_DIFF_THRESHOLD,
    livePath: path.relative(process.cwd(), livePath),
    testPath: path.relative(process.cwd(), testPath),
    diffPath: path.relative(process.cwd(), diffPath),
    liveWidth: liveImage.width,
    liveHeight: liveImage.height,
    testWidth: testImage.width,
    testHeight: testImage.height,
    comparedWidth: width,
    comparedHeight: height,
    capture: {
      live: liveCapture,
      test: testCapture,
    },
  };
}

function createScreenshotError(routePath, error) {
  return {
    diffPixels: null,
    diffPercent: null,
    threshold: SCREENSHOT_DIFF_THRESHOLD,
    passed: false,
    routePath,
    error: error.message,
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Site parity checklist');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Live origin: ${report.liveOrigin}`);
  lines.push(`Test origin: ${report.testOrigin}`);
  lines.push(`Viewport: ${report.viewport.width}×${report.viewport.height}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Routes checked: ${report.routes.length}`);
  lines.push(`- Route/status mismatches: ${report.summary.routeMismatches}`);
  lines.push(`- Title mismatches: ${report.summary.titleMismatches}`);
  lines.push(`- Heading order mismatches: ${report.summary.headingSequenceMismatches}`);
  lines.push(`- Missing element signatures: ${report.summary.missingElements}`);
  lines.push(`- Unexpected test-only signatures: ${report.summary.extraElements}`);
  lines.push(`- Appearance mismatches: ${report.summary.styleMismatches}`);
  lines.push(`- Layout mismatches: ${report.summary.layoutMismatches}`);
  lines.push(`- Container/section style mismatches: ${report.summary.containerMismatches}`);
  lines.push(`- Element interactivity mismatches: ${report.summary.elementInteractivityMismatches || 0}`);
  lines.push(`- Missing interactive elements: ${report.summary.missingInteractive}`);
  lines.push(`- Interactivity behavior mismatches: ${report.summary.interactivityDiffs}`);
  lines.push(`- Hover effect mismatches: ${report.summary.hoverMismatches}`);
  lines.push(`- Click behavior mismatches (tabs/accordions): ${report.summary.clickBehaviorMismatches || 0}`);
  lines.push(`- Dropdown mismatches (nav dropdowns): ${report.summary.dropdownMismatches || 0}`);
  lines.push(`- Image dimension mismatches: ${report.summary.imageDimensionMismatches || 0}`);
  lines.push(`- Webflow element mismatches (data-wf-el total): ${report.summary.wfElementMismatches || 0}`);
  lines.push(`- Webflow element style mismatches (data-wf-el): ${report.summary.wfStyleMismatches || 0}`);
  lines.push(`- Webflow element layout mismatches (data-wf-el): ${report.summary.wfLayoutMismatches || 0}`);
  lines.push(`- Webflow elements unmatched on test: ${report.summary.wfElementsMissing || 0}`);
  lines.push(`- Webflow elements extra on test: ${report.summary.wfElementsExtra || 0}`);
  lines.push(`- Animations / transitions missing on test: ${report.summary.animationsMissing || 0}`);
  lines.push(`- Animation property mismatches: ${report.summary.animationPropDiffs || 0}`);
  lines.push(`- Animations / transitions extra on test: ${report.summary.animationsExtra || 0}`);
  lines.push(`- Interactive widgets missing on test (data-marquee/splide/modal/...): ${report.summary.widgetsMissing || 0}`);
  lines.push(`- Interactive widgets extra on test: ${report.summary.widgetsExtra || 0}`);
  lines.push(`- Screenshot mismatches (> ${SCREENSHOT_DIFF_THRESHOLD}% or unavailable): ${report.summary.screenshotMismatches}`);
  lines.push(`- Screenshot capture failures: ${report.summary.screenshotUnavailable || 0}`);
  lines.push(`- Total failing checks: ${report.summary.failedChecklistItems}`);
  lines.push('');

  // Style-diff category breakdown
  if (report.summary.styleDiffsByProperty && report.summary.styleDiffsByProperty.length > 0) {
    lines.push('### Appearance mismatches by CSS property');
    lines.push('');
    for (const cat of report.summary.styleDiffsByProperty) {
      lines.push(`- **${cat.label}** (${cat.property}): ${cat.count} mismatches`);
      for (const ex of cat.examples) {
        lines.push(`  - ${ex.route} | ${ex.signature} | ${ex.diff}`);
      }
    }
    lines.push('');
  }

  for (const route of report.routes) {
    lines.push(`## ${route.path}`);
    lines.push('');
    lines.push(`- [${route.testStatus < 400 ? 'x' : ' '}] Route exists on company-website (${route.liveStatus} vs ${route.testStatus})`);
    lines.push(`- [${route.titleMatches ? 'x' : ' '}] Title matches${route.titleMatches ? '' : ` (live: ${route.liveTitle} | test: ${route.testTitle})`}`);
    lines.push(`- [${route.headingSequenceMatches ? 'x' : ' '}] Heading order matches${route.headingSequenceMatches ? '' : ` (${route.headingSequenceDiffs.join(' | ')})`}`);

    if (route.screenshotDiff) {
      if (route.screenshotDiff.error) {
        lines.push(`- [ ] Screenshot diff unavailable: ${route.screenshotDiff.error}`);
      } else {
        lines.push(`- [${route.screenshotDiff.passed ? 'x' : ' '}] Screenshot diff within threshold (${route.screenshotDiff.diffPercent}% vs threshold ${route.screenshotDiff.threshold}%)`);
        lines.push(`  - live screenshot: ${route.screenshotDiff.livePath} (${route.screenshotDiff.liveWidth}×${route.screenshotDiff.liveHeight})`);
        lines.push(`  - test screenshot: ${route.screenshotDiff.testPath} (${route.screenshotDiff.testWidth}×${route.screenshotDiff.testHeight})`);
        lines.push(`  - diff screenshot: ${route.screenshotDiff.diffPath}`);
      }
    }

    // High-signal summary: flag the 10 largest Y-position drifts on this
    // route, sorted by absolute delta.  Big top-deltas almost always
    // mean a structural difference upstream (fabricated section, wrong
    // padding/margin on a section header, missing/extra block) rather
    // than a per-element styling tweak — surfacing them at the top of
    // the route block makes structural regressions much easier to spot
    // than scrolling through hundreds of `layout mismatch` lines below.
    const driftEntries = [];
    for (const item of route.checklist) {
      for (const diff of (item.layoutDiffs || [])) {
        if (typeof diff !== 'string' || !diff.startsWith('top:')) continue;
        const m = /live=(-?\d+(?:\.\d+)?)\s+test=(-?\d+(?:\.\d+)?)/.exec(diff);
        if (!m) continue;
        const liveY = Number(m[1]);
        const testY = Number(m[2]);
        const delta = testY - liveY;
        if (Math.abs(delta) < 50) continue;
        driftEntries.push({
          delta,
          liveY,
          testY,
          label: (item.signature + (item.instanceLabel || '')).slice(0, 80),
        });
      }
    }
    if (driftEntries.length > 0) {
      driftEntries.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
      lines.push('');
      lines.push('### Major Y-position drift (>50px, top 10)');
      lines.push('');
      lines.push('Big top-coordinate deltas usually reflect a structural');
      lines.push('difference upstream — a fabricated section, missing block,');
      lines.push('or wrong wrapper padding — rather than a per-element style');
      lines.push('tweak.  Read this list first; many `layout mismatch` lines');
      lines.push('below this point are downstream consequences of the same');
      lines.push('upstream drift.');
      lines.push('');
      for (const drift of driftEntries.slice(0, 10)) {
        const sign = drift.delta > 0 ? '+' : '';
        lines.push(`- live_top=${drift.liveY.toFixed(0)} test_top=${drift.testY.toFixed(0)} delta=${sign}${drift.delta.toFixed(0)}px — ${drift.label}`);
      }
    }

    for (const item of route.checklist) {
      const details = [];
      if (item.testStyle === null) {
        details.push('missing on test');
      }
      if (item.styleDiffs.length > 0) {
        details.push(`appearance mismatch: ${item.styleDiffs.join('; ')}`);
      }
      if ((item.layoutCauseDiffs || []).length > 0) {
        details.push(`layout-cause style mismatch: ${item.layoutCauseDiffs.join('; ')}`);
      }
      if ((item.sizeDiffs || []).length > 0) {
        details.push(`size mismatch: ${item.sizeDiffs.join('; ')}`);
      }
      if ((item.opacityDiffs || []).length > 0) {
        details.push(`opacity mismatch: ${item.opacityDiffs.join('; ')}`);
      }
      if (item.layoutDiffs.length > 0) {
        details.push(`layout mismatch: ${item.layoutDiffs.join('; ')}`);
      }
      if (item.interactivityDiffs.length > 0) {
        details.push(`interactivity mismatch: ${item.interactivityDiffs.join('; ')}`);
      }
      if (item.ancestorDiffs && item.ancestorDiffs.length > 0) {
        details.push(`container mismatch: ${item.ancestorDiffs.join('; ')}`);
      }
      const suffix = details.length > 0 ? ` — ${details.join(' | ')}` : '';
      const label = item.signature + (item.instanceLabel || '');
      lines.push(`- [${item.passed ? 'x' : ' '}] ${label}${suffix}`);
    }

    for (const extra of route.extraElements) {
      lines.push(`- [ ] EXTRA:${extra.signature} — unexpected on test site (count ${extra.count})`);
    }

    // Container/section style mismatches
    if (route.containerDiffs && route.containerDiffs.length > 0) {
      lines.push('');
      lines.push('### Container/section style mismatches');
      for (const diff of route.containerDiffs) {
        lines.push(`- [ ] ${diff.tag}[${diff.liveLabel}] — ${diff.diffs.join('; ')}`);
      }
    }

    // Interactivity mismatches
    const inter = route.interactivity || {};
    if ((inter.missingInteractive || []).length > 0) {
      lines.push('');
      lines.push('### Missing interactive elements');
      for (const item of inter.missingInteractive) {
        lines.push(`- [ ] ${item.signature} — interactive on live (cursor: ${item.cursor}) but missing on test`);
      }
    }
    if ((inter.interactivityDiffs || []).length > 0) {
      lines.push('');
      lines.push('### Interactivity behavior mismatches');
      for (const item of inter.interactivityDiffs) {
        lines.push(`- [ ] ${item.signature} — ${item.diffs.join('; ')}`);
      }
    }
    if ((inter.extraInteractive || []).length > 0) {
      lines.push('');
      lines.push('### Extra interactive elements (test only)');
      for (const item of inter.extraInteractive) {
        lines.push(`- [ ] ${item.signature} — interactive on test (cursor: ${item.cursor}) but not on live`);
      }
    }

    // Hover effect mismatches
    if (route.hoverDiffs && route.hoverDiffs.length > 0) {
      lines.push('');
      lines.push('### Hover effect mismatches');
      for (const diff of route.hoverDiffs) {
        const changes = diff.liveChanges || diff.testChanges || [];
        lines.push(`- [ ] ${diff.signature} — ${diff.issue}${changes.length > 0 ? ` (${changes.join('; ')})` : ''}`);
      }
    }

    // Click behavior mismatches (tabs, accordions, toggles)
    if (route.clickBehaviorDiffs && route.clickBehaviorDiffs.length > 0) {
      lines.push('');
      lines.push('### Click behavior mismatches (tabs/accordions)');
      for (const diff of route.clickBehaviorDiffs) {
        const changes = diff.liveChanges || diff.testChanges || [];
        lines.push(`- [ ] ${diff.signature} — ${diff.issue}${changes.length > 0 ? ` (${changes.join('; ')})` : ''}`);
      }
    }

    // Dropdown mismatches (nav dropdowns)
    if (route.dropdownDiffs && route.dropdownDiffs.length > 0) {
      lines.push('');
      lines.push('### Dropdown mismatches (nav menus)');
      for (const diff of route.dropdownDiffs) {
        lines.push(`- [ ] "${diff.trigger}" — ${diff.issue} (live links: ${diff.liveLinks}, test links: ${diff.testLinks})`);
      }
    }

    // Image dimension mismatches
    if (route.imageDiffs && route.imageDiffs.length > 0) {
      lines.push('');
      lines.push('### Image dimension mismatches');
      for (const diff of route.imageDiffs) {
        lines.push(`- [ ] ${diff.signature} — rendered: live=${diff.liveRendered} test=${diff.testRendered}; natural: live=${diff.liveNatural} test=${diff.testNatural}`);
      }
    }

    // CSS custom property mismatches
    if (route.cssVarDiffs && route.cssVarDiffs.length > 0) {
      lines.push('');
      lines.push('### CSS custom property mismatches');
      for (const diff of route.cssVarDiffs) {
        lines.push(`- [ ] ${diff.name} — live=${diff.live} test=${diff.test}`);
      }
    }

    // Webflow element (data-wf-el) comparison
    if (route.wfComparison) {
      const wf = route.wfComparison;
      const failedMatches = wf.matched.filter((m) => !m.passed);
      if (failedMatches.length > 0 || wf.missingOnTest.length > 0 || wf.extraOnTest.length > 0) {
        lines.push('');
        lines.push('### Webflow element mismatches (data-wf-el)');
        for (const m of wf.matched) {
          const details = [];
          if (m.styleDiffs.length > 0) details.push(`style: ${m.styleDiffs.join('; ')}`);
          if (m.layoutDiffs.length > 0) details.push(`layout: ${m.layoutDiffs.join('; ')}`);
          const suffix = details.length > 0 ? ` — ${details.join(' | ')}` : '';
          lines.push(`- [${m.passed ? 'x' : ' '}] ${m.key} (${m.tag})${suffix}`);
        }
        for (const m of wf.missingOnTest) {
          lines.push(`- [ ] ${m.key} (${m.tag}) — live element has no data-wf-el match on test`);
        }
        for (const m of wf.extraOnTest) {
          lines.push(`- [ ] ${m.key} (${m.tag}) — test has data-wf-el="${m.key}" but no matching class on live`);
        }
      }
    }

    // Animation / transition / interactive widget comparison
    if (route.animationComparison) {
      const ac = route.animationComparison;
      const total = ac.missingAnimations.length + ac.extraAnimations.length + ac.propDiffs.length + ac.missingWidgets.length + ac.extraWidgets.length;
      if (total > 0) {
        lines.push('');
        lines.push('### Animation / transition / widget mismatches');
        lines.push(`- live elements with animation/transition/sticky/willChange: ${ac.liveAnimationCount}, test: ${ac.testAnimationCount}`);
        // Cap reporting volume so a global transition rule (e.g. body * { transition: color }) doesn't flood the report.
        const MAX = 40;
        for (const m of ac.missingAnimations.slice(0, MAX)) {
          lines.push(`- [ ] missing on test: ${m.signature} (${m.tag}) — ${m.cause}`);
        }
        if (ac.missingAnimations.length > MAX) {
          lines.push(`  - …and ${ac.missingAnimations.length - MAX} more missing animations`);
        }
        for (const d of ac.propDiffs.slice(0, MAX)) {
          lines.push(`- [ ] ${d.signature} (${d.tag}) — ${d.diffs.join('; ')}`);
        }
        if (ac.propDiffs.length > MAX) {
          lines.push(`  - …and ${ac.propDiffs.length - MAX} more property diffs`);
        }
        for (const m of ac.extraAnimations.slice(0, MAX)) {
          lines.push(`- [ ] extra on test: ${m.signature} (${m.tag}) — ${m.cause}`);
        }
        if (ac.extraAnimations.length > MAX) {
          lines.push(`  - …and ${ac.extraAnimations.length - MAX} more extra animations`);
        }
        for (const w of ac.missingWidgets) {
          const detail = w.testCount !== undefined ? ` (live ${w.liveCount}× / test ${w.testCount}×)` : ` (live ${w.liveCount}×)`;
          lines.push(`- [ ] interactive widget missing on test: ${w.attr}${detail}`);
        }
        for (const w of ac.extraWidgets) {
          lines.push(`- [ ] interactive widget extra on test: ${w.attr} (test ${w.testCount}×)`);
        }
      }
    }

    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${label} after ${ms}ms`)), ms)),
  ]);
}

async function primeLazyImages(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const step = Math.max(window.innerHeight, 900);
    const maxY = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    const steps = Math.min(Math.ceil(Math.max(maxY, 0) / step), 20);
    for (let index = 0; index <= steps; index += 1) {
      window.scrollTo(0, Math.min(index * step, maxY));
      await sleep(50);
    }
    window.scrollTo(0, 0);
    // Wait long enough for live's GSAP/Webflow IX2 reveal animations to
    // finish before extractPageInventory reads computed visibility.
    // The hero H1 on live carries `data-hidden=" "` and starts at
    // opacity:0; Webflow's reveal animation fades it to opacity:1 after
    // ~300-500ms.  Under parallel live+test load, the previous 200ms
    // sleep was sometimes too short, causing the H1 (and other revealed
    // elements like the AMD testimonial card) to be invisible to the
    // inventory pass — producing fake heading-sequence diffs.
    await sleep(1500);
    // Dispatch a resize event so any layouts that collapsed during the
    // scroll-prime sequence (e.g. Webflow logo marquee items going to
    // width:0px because of a flex re-layout triggered by intersection
    // observer firing during scroll) have a chance to recompute their
    // intrinsic widths.  Without this, live's customer-logo strip and
    // workflow-card icon images read as `0×24` in the inventory pass and
    // get filtered out as invisible, producing 30+ fake "extra-on-test"
    // signatures.
    window.dispatchEvent(new Event('resize'));
    await sleep(300);
    // Force-reset any width: 0 / height: 0 inline styles that Webflow's
    // JS may have stamped on marquee items.  Some Webflow IX2 effects
    // (logo carousel, decorative svg strips) animate transform but leave
    // a stray inline style with width: 0 after the animation cycles.
    document.querySelectorAll('img').forEach((img) => {
      const r = img.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        // Walk up looking for an ancestor with a 0-px inline width or
        // transform: scale(0); reset its inline style so the image can
        // be sized by its natural width again.
        let walker = img.parentElement;
        let depth = 0;
        while (walker && depth < 6) {
          const inline = walker.style;
          if (inline.width === '0px' || inline.height === '0px' ||
              /scale\(0/.test(inline.transform || '')) {
            inline.removeProperty('width');
            inline.removeProperty('height');
            inline.removeProperty('transform');
          }
          walker = walker.parentElement;
          depth += 1;
        }
      }
    });
    await sleep(200);
  });
}

async function waitForVisibleImages(page, timeoutMs = 5000) {
  await page.evaluate(async (timeout) => {
    const deadline = Date.now() + timeout;
    const images = Array.from(document.images).filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= window.innerHeight;
    });

    await Promise.all(images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        const poll = () => {
          if ((img.complete && img.naturalWidth > 0) || Date.now() > deadline) done();
          else setTimeout(poll, 100);
        };
        poll();
      });
    }));
  }, timeoutMs);
}

async function loadPage(page, origin, routePath) {
  const pageTimeout = 30000;
  const extractTimeout = 20000;
  const url = new URL(routePath, origin).toString();

  const response = await withTimeout(
    page.goto(url, { waitUntil: 'load', timeout: pageTimeout }),
    pageTimeout + 5000,
    `goto ${url}`,
  );

  // Initial settle: live's Webflow IX2 init runs ~500-800ms after load,
  // and the customer-logo marquee + workflow-icon reveal animations take
  // another ~1.5-2s to enter their first stable cycle.  4s gives them
  // enough time to fully populate dimensions before primeLazyImages runs
  // and removes the inline width:0 markers.  Earlier 2s settle was too
  // short under puppeteer's slower exec context, leaving 30+ logos at
  // width:0 even after the prime-strip pass.
  await withTimeout(
    page.evaluate(() => new Promise((r) => setTimeout(r, 4000))),
    12000,
    `settle delay ${url}`,
  );

  await withTimeout(
    primeLazyImages(page),
    15000,
    `prime lazy images ${url}`,
  );

  await withTimeout(
    waitForVisibleImages(page),
    8000,
    `visible images ${url}`,
  );

  // Force Webflow IX2 / GSAP reveal-animated elements to their final
  // visible state before extracting computed styles.
  //
  // Live Webflow pages tag prerender-hidden elements with `data-hidden=" "`
  // and run reveal animations through Webflow IX2 (which uses GSAP and
  // the Web Animations API).  Under puppeteer's parallel live+test load
  // the animations frequently haven't finished when extractPageInventory
  // runs, leaving the hero H1, hero subhead, hero CTAs, and the active
  // testimonial card at computed opacity:0 — producing fake heading-
  // sequence and missing-element diffs versus the test site.
  //
  // CSS `!important` overrides DO NOT win against an in-flight WAAPI
  // animation; the animation's keyframe values stack ABOVE the cascade
  // until the animation ends.  So we must:
  //   1. cancel/finish all live Web Animations to release the keyframe
  //      lock,
  //   2. strip `data-hidden` from the DOM (Webflow keys the pre-reveal
  //      CSS rule off this attribute),
  //   3. inject a stylesheet that pins splide carousel slides visible
  //      and zeros animation/transition durations so they don't restart.
  await page.evaluate(() => {
    if (typeof document.getAnimations === 'function') {
      document.getAnimations().forEach((animation) => {
        try { animation.finish(); } catch (err) { /* ignore */ }
        try { animation.cancel(); } catch (err) { /* ignore */ }
      });
    }
    document.querySelectorAll('[data-hidden]').forEach((el) => {
      el.removeAttribute('data-hidden');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    // After cancelling animations, GSAP / Webflow IX2 restores any inline
    // styles it stamped on at the animation's start frame — most notably
    // `width: 0px` / `height: 0px` / `transform: scale(0)` on logo
    // marquee items, decorative svg strips, and reveal-animated images.
    // Strip those leftover collapsed inline styles so the affected
    // elements size to their natural intrinsic dimensions instead of
    // being reported as 0×N invisible by the inventory extractor.
    document.querySelectorAll('img').forEach((img) => {
      const r = img.getBoundingClientRect();
      if (r.width !== 0 && r.height !== 0) return;
      let walker = img.parentElement;
      let depth = 0;
      while (walker && depth < 8) {
        const inline = walker.style;
        if (inline.width === '0px' || inline.height === '0px') {
          inline.removeProperty('width');
          inline.removeProperty('height');
        }
        if (inline.transform && /scale|translate/.test(inline.transform)) {
          inline.removeProperty('transform');
        }
        walker = walker.parentElement;
        depth += 1;
      }
      // Also clear inline styles directly on the img itself.
      if (img.style.width === '0px') img.style.removeProperty('width');
      if (img.style.height === '0px') img.style.removeProperty('height');
      if (/scale|translate/.test(img.style.transform || '')) {
        img.style.removeProperty('transform');
      }
    });
    const styleEl = document.createElement('style');
    styleEl.id = '__parity_reveal_override__';
    styleEl.textContent = `
      .splide__slide,
      .splide__slide * {
        opacity: 1 !important;
        transform: none !important;
        visibility: visible !important;
      }
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
      }
      /* Webflow IX2 logo marquees stamp inline width:0 onto items as
         they reveal.  Force their li/div wrappers and inner imgs to use
         their natural size so the inventory pass can see them. */
      .logo-grid-component_cms_item,
      .logo-grid-component_cms_item *,
      .standard-media,
      .standard-media-img,
      .quote-author-media,
      .client-media-img,
      .icon, .icon-media,
      .capabilities_card_icon,
      .capabilities_card_image,
      .img-component {
        opacity: 1 !important;
        visibility: visible !important;
      }
    `;
    document.head.appendChild(styleEl);
    // Disarm Webflow IX2 / GSAP to stop them from re-stamping inline
    // width:0 / scale(0) on revealed elements after the override fires.
    if (window.Webflow && typeof window.Webflow.destroy === 'function') {
      try { window.Webflow.destroy(); } catch (e) { /* ignore */ }
    }
    if (window.gsap) {
      try {
        if (window.gsap.killTweensOf) window.gsap.killTweensOf('*');
        if (window.ScrollTrigger && window.ScrollTrigger.killAll) {
          window.ScrollTrigger.killAll();
        }
      } catch (e) { /* ignore */ }
    }
    // Force a reflow so the override takes effect before extraction.
    document.body.getBoundingClientRect();
  });

  // Brief settle delay after the override so any ongoing layout updates
  // finish before we read computed styles / rects.
  await page.evaluate(() => new Promise((r) => setTimeout(r, 250)));

  // Scroll the page from top to bottom in viewport-sized steps so
  // `loading="lazy"` images (and any IntersectionObserver-driven
  // lazy assets) actually load before we measure heights.  Without
  // this, sections that contain large below-the-fold images report
  // their pre-load (text-only) heights — making the parity report
  // hallucinate hundreds of pixels of section-height drift between
  // live and test that don't exist once the user actually scrolls.
  await page.evaluate(async () => {
    // First, force-load every `loading="lazy"` image by removing the
    // attribute.  `loading=lazy` images do not contribute to the
    // `window.load` event, so the parity script's `waitUntil: 'load'`
    // returns before they have started fetching — even when they sit
    // inside the initial viewport.  Stripping the attribute kicks off
    // the network request immediately and lets us await a real image
    // load below.
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = 'eager';
    });

    const step = Math.max(400, window.innerHeight);
    const totalHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    );
    const maxSteps = 30;
    let steps = 0;
    for (let y = 0; y < totalHeight && steps < maxSteps; y += step, steps++) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, totalHeight);
    await new Promise((r) => setTimeout(r, 100));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 50));

    // Now wait for every still-incomplete image to finish loading so
    // their natural sizes are reflected in the page layout.  Cap each
    // image's wait at 1.5s so a single slow CDN response doesn't stall
    // the whole comparison.
    const imgs = Array.from(document.images || []);
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            img.removeEventListener('load', finish);
            img.removeEventListener('error', finish);
            resolve();
          };
          img.addEventListener('load', finish);
          img.addEventListener('error', finish);
          setTimeout(finish, 1500);
        });
      }),
    );
    // Force a layout flush so the freshly-loaded images contribute
    // their final intrinsic heights to ancestor sections before we
    // measure rects.
    document.body.getBoundingClientRect();
  });

  const isLiveSite = origin === LIVE_ORIGIN;
  const [inventory, containers, interactive, cssVars, wfElements, animations] = await withTimeout(
    Promise.all([
      extractPageInventory(page),
      extractContainerStyles(page),
      extractInteractivity(page),
      extractCSSCustomProperties(page),
      extractWebflowElements(page, isLiveSite),
      extractAnimations(page),
    ]),
    extractTimeout,
    `extraction ${url}`,
  );

  let hoverEffects = [];
  try {
    hoverEffects = await withTimeout(
      extractHoverDiffs(page, 'a[href], button, [role="button"], [role="tab"]'),
      15000,
      `hover diffs ${url}`,
    );
  } catch {
    // hover extraction is best-effort
  }

  let clickBehavior = [];
  try {
    clickBehavior = await withTimeout(
      extractClickBehavior(page),
      20000,
      `click behavior ${url}`,
    );
  } catch {
    // click behavior extraction is best-effort
  }

  let dropdowns = [];
  try {
    dropdowns = await withTimeout(
      extractDropdownContent(page),
      20000,
      `dropdown content ${url}`,
    );
  } catch {
    // dropdown extraction is best-effort
  }

  return {
    status: response?.status() || 0,
    inventory,
    containers,
    interactive,
    hoverEffects,
    clickBehavior,
    dropdowns,
    cssVars,
    wfElements,
    animations,
  };
}

async function discoverPaths(browser) {
  const explicit = (process.env.PARITY_PATHS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (explicit.length > 0) {
    return explicit.sort((left, right) => {
      if (left === '/') return -1;
      if (right === '/') return 1;
      return left.localeCompare(right);
    });
  }
  const seeds = await getSitemapPaths(LIVE_ORIGIN);
  const discovered = new Set([...DEFAULT_DISCOVERY_PATHS, ...seeds]);
  const queue = [...discovered];
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  let visited = 0;
  while (queue.length > 0 && visited < DISCOVERY_PAGE_LIMIT && discovered.size < MAX_PAGES) {
    const currentPath = queue.shift();
    visited += 1;

    try {
      await page.goto(new URL(currentPath, LIVE_ORIGIN).toString(), {
        waitUntil: 'load',
        timeout: 60000,
      });
      const links = await collectInternalLinks(page, LIVE_ORIGIN);
      for (const linkPath of links) {
        if (discovered.has(linkPath)) continue;
        discovered.add(linkPath);
        queue.push(linkPath);
        if (discovered.size >= MAX_PAGES) break;
      }
    } catch (error) {
      console.warn(`Skipping discovery for ${currentPath}: ${error.message}`);
    }
  }

  await page.close();
  return [...discovered].sort((left, right) => {
    if (left === '/') return -1;
    if (right === '/') return 1;
    return left.localeCompare(right);
  });
}

async function main() {
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`[parity] Launching browser (viewport ${VIEWPORT.width}×${VIEWPORT.height})...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: PROTOCOL_TIMEOUT,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    console.log('[parity] Discovering paths...');
    const paths = await discoverPaths(browser);
    console.log(`[parity] Found ${paths.length} paths: ${paths.join(', ')}`);
    const routes = [];

    for (const [index, routePath] of paths.entries()) {
      const [livePage, testPage] = await Promise.all([browser.newPage(), browser.newPage()]);

      try {
        await Promise.all([livePage.setViewport(VIEWPORT), testPage.setViewport(VIEWPORT)]);
        console.log(`[parity] Loading ${routePath} (${index + 1}/${paths.length})...`);
        // Sequential live+test loads.  Earlier we ran them in Promise.all
        // for speed, but running both pages concurrently in the same
        // chromium process caused CPU contention that prevented Webflow
        // IX2 reveal animations from finishing within the prime sequence's
        // 1500ms settle, leaving live's customer-logo strip and workflow
        // icon images at width:0 / opacity:0 — producing 30+ fake
        // 'extra-on-test' IMG signatures.  Sequential loads add ~6s per
        // route but make extraction deterministic.
        const liveData = await loadPage(livePage, LIVE_ORIGIN, routePath);
        const testData = await loadPage(testPage, TEST_ORIGIN, routePath);
        console.log(`[parity] Loaded ${routePath}, live=${liveData.status} test=${testData.status}`);

        let screenshotDiff = null;
        if (index < SCREENSHOT_PAGE_LIMIT) {
          try {
            screenshotDiff = await captureScreenshotDiff(livePage, testPage, routePath);
          } catch (error) {
            screenshotDiff = createScreenshotError(routePath, error);
            console.warn(`Screenshot diff unavailable for ${routePath}: ${error.message}`);
          }
        }

        const routeResult = summarizeRouteComparison(routePath, liveData, testData, screenshotDiff);
        routes.push(routeResult);
        console.log(`Compared ${routePath}`);

        // ── Incremental output: write per-route JSON immediately ──
        const safeSlug = routePath.replace(/\//g, '_').replace(/^_/, '') || 'index';
        const routeJsonPath = path.join(OUTPUT_DIR, `route-${safeSlug}.json`);
        await fsp.writeFile(routeJsonPath, JSON.stringify(routeResult, null, 2));

        // Write a lightweight progress manifest so consumers can poll
        const progressPath = path.join(OUTPUT_DIR, '_progress.json');
        await fsp.writeFile(progressPath, JSON.stringify({
          completedRoutes: routes.map((r) => r.path),
          totalPlanned: paths.length,
          done: routes.length === paths.length,
        }, null, 2));
      } catch (error) {
        console.warn(`Failed to compare ${routePath}: ${error.message}`);
      } finally {
        await Promise.all([livePage.close().catch(() => {}), testPage.close().catch(() => {})]);
      }
    }

    const report = {
      generatedAt: new Date().toISOString(),
      liveOrigin: LIVE_ORIGIN,
      testOrigin: TEST_ORIGIN,
      viewport: VIEWPORT,
      summary: {
        routeMismatches: routes.filter((route) => route.testStatus >= 400 || route.liveStatus >= 400).length,
        titleMismatches: routes.filter((route) => !route.titleMatches).length,
        headingSequenceMismatches: routes.filter((route) => !route.headingSequenceMatches).length,
        missingElements: routes.reduce((total, route) => total + route.missingElementsCount, 0),
        extraElements: routes.reduce((total, route) => total + route.extraElementsCount, 0),
        styleMismatches: routes.reduce((total, route) => total + route.styleMismatchCount, 0),
        sizeMismatches: routes.reduce((total, route) => total + (route.sizeMismatchCount || 0), 0),
        opacityMismatches: routes.reduce((total, route) => total + (route.opacityMismatchCount || 0), 0),
        layoutMismatches: routes.reduce((total, route) => total + route.layoutMismatchCount, 0),
        containerMismatches: routes.reduce((total, route) => total + (route.containerMismatchCount || 0), 0),
        elementInteractivityMismatches: routes.reduce((total, route) => total + (route.elementInteractivityMismatchCount || 0), 0),
        missingInteractive: routes.reduce((total, route) => total + (route.missingInteractiveCount || 0), 0),
        interactivityDiffs: routes.reduce((total, route) => total + (route.interactivityDiffCount || 0), 0),
        hoverMismatches: routes.reduce((total, route) => total + (route.hoverMismatchCount || 0), 0),
        clickBehaviorMismatches: routes.reduce((total, route) => total + (route.clickBehaviorDiffCount || 0), 0),
        dropdownMismatches: routes.reduce((total, route) => total + (route.dropdownDiffCount || 0), 0),
        imageDimensionMismatches: routes.reduce((total, route) => total + (route.imageDiffCount || 0), 0),
        wfElementMismatches: routes.reduce((total, route) => total + (route.wfMismatchCount || 0), 0),
        wfStyleMismatches: routes.reduce((total, route) => total + (route.wfStyleMismatchCount || 0), 0),
        wfLayoutMismatches: routes.reduce((total, route) => total + (route.wfLayoutMismatchCount || 0), 0),
        wfElementsMissing: routes.reduce((total, route) => total + (route.wfMissingCount || 0), 0),
        wfElementsExtra: routes.reduce((total, route) => total + (route.wfExtraCount || 0), 0),
        animationsMissing: routes.reduce((total, route) => total + (route.animationMissingCount || 0), 0),
        animationsExtra: routes.reduce((total, route) => total + (route.animationExtraCount || 0), 0),
        animationPropDiffs: routes.reduce((total, route) => total + (route.animationPropDiffCount || 0), 0),
        widgetsMissing: routes.reduce((total, route) => total + (route.widgetMissingCount || 0), 0),
        widgetsExtra: routes.reduce((total, route) => total + (route.widgetExtraCount || 0), 0),
        screenshotMismatches: routes.filter((route) => route.screenshotDiff && !route.screenshotDiff.passed).length,
        screenshotUnavailable: routes.filter((route) => route.screenshotDiff?.error).length,
      },
      routes,
    };

    // Add per-property style-diff category breakdown
    report.summary.styleDiffsByProperty = categorizeStyleDiffs(routes);

    report.summary.failedChecklistItems =
      report.summary.routeMismatches +
      report.summary.titleMismatches +
      report.summary.headingSequenceMismatches +
      report.summary.missingElements +
      report.summary.extraElements +
      report.summary.styleMismatches +
      report.summary.layoutMismatches +
      report.summary.containerMismatches +
      (report.summary.elementInteractivityMismatches || 0) +
      report.summary.missingInteractive +
      report.summary.interactivityDiffs +
      report.summary.hoverMismatches +
      (report.summary.clickBehaviorMismatches || 0) +
      (report.summary.dropdownMismatches || 0) +
      report.summary.imageDimensionMismatches +
      (report.summary.wfElementMismatches || 0) +
      (report.summary.animationsMissing || 0) +
      (report.summary.animationsExtra || 0) +
      (report.summary.animationPropDiffs || 0) +
      (report.summary.widgetsMissing || 0) +
      report.summary.screenshotMismatches;

    const jsonPath = path.join(OUTPUT_DIR, 'site-parity-checklist.json');
    const markdownPath = path.join(OUTPUT_DIR, 'site-parity-checklist.md');

    await Promise.all([
      fsp.writeFile(jsonPath, JSON.stringify(report, null, 2)),
      fsp.writeFile(markdownPath, renderMarkdown(report)),
    ]);

    console.log(`\nWrote JSON report to ${jsonPath}`);
    console.log(`Wrote Markdown checklist to ${markdownPath}`);
  } finally {
    await browser.close();
  }
}

module.exports = {
  capturePageScreenshot,
  capturePageScreenshotInChunks,
  captureScreenshotDiff,
  categorizeStyleDiffs,
  compareClickBehavior,
  compareContainerStyles,
  compareDropdowns,
  compareHoverEffects,
  compareInteractivity,
  compareStyleValue,
  compareWebflowElements,
  copyPngInto,
  extractDropdownContent,
  extractWebflowElements,
  getScreenshotMetrics,
  normalizeFontFamily,
  normalizeTransition,
  padImage,
  primaryFontMatches,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
