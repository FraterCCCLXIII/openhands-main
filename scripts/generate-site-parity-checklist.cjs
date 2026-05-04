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
  'borderStyle',
  'borderColor',
  // Effects / interactivity
  'cursor',
  'opacity',
  'boxShadow',
];
const STYLE_CHECK_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BUTTON', 'LABEL', 'INPUT', 'IMG', 'P', 'SPAN', 'DIV', 'SUMMARY', 'DETAILS', 'NAV', 'SECTION', 'ARTICLE', 'UL', 'LI']);
const LAYOUT_CHECK_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'A', 'BUTTON', 'LABEL', 'INPUT', 'IMG', 'P', 'DIV']);

const CONTAINER_STYLE_PROPS = [
  'backgroundColor',
  'backgroundImage',
  'borderRadius',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
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
    const toleranceByProp = {
      fontSize: 2,
      fontWeight: 100,
      lineHeight: 3,
      borderRadius: 3,
      letterSpacing: 1,
      textUnderlineOffset: 2,
      textDecorationThickness: 1,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 8,
      paddingRight: 8,
    };
    const tolerance = toleranceByProp[prop] || 2;
    if (Math.abs(livePx - testPx) <= tolerance) return null;
  }

  if (prop === 'backgroundImage') {
    if (backgroundImagesMatch(liveValue, testValue, LIVE_ORIGIN, TEST_ORIGIN)) return null;

    const simplify = (value) => (value || '').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    if (simplify(liveValue) === simplify(testValue)) return null;
  }

  return `${prop}: live=${liveValue} test=${testValue}`;
}

function compareStyles(liveStyle, testStyle) {
  const diffs = [];
  for (const prop of STYLE_PROPS) {
    const diff = compareStyleValue(prop, liveStyle?.[prop], testStyle?.[prop], liveStyle, testStyle);
    if (diff) diffs.push(diff);
  }
  return diffs;
}

// Compare ancestor (wrapper/container) styles captured during extraction.
// Catches visual mismatches on parent elements like button wrappers with
// borderRadius or backgroundColor that the text-matched child doesn't carry.
const ANCESTOR_COMPARE_PROPS = ['borderRadius', 'backgroundColor', 'boxShadow', 'padding'];
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
      const tol = prop === 'borderRadius' ? 3 : prop === 'padding' ? 8 : 2;
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
  return page.evaluate((styleProps) => {
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
      'div[role]',
      'div[aria-hidden]',
    ].join(',');

    const normalizeWhitespaceInner = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const normalizeTextInner = (value) => normalizeWhitespaceInner(value).toLowerCase();
    const elements = [];
    const signatureCounter = new Map();

    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return false;

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

      // For IMG/VIDEO with no text, derive a signature from the src filename
      // so decorative images can still be matched cross-site.
      let srcFilename = '';
      if (!normalizedText && (tag === 'IMG' || tag === 'VIDEO')) {
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
      const signature = normalizedText
        ? `${tag}:${normalizedText.slice(0, 140)}`
        : `${tag}:[src:${srcFilename}]`;
      const style = Object.fromEntries(styleProps.map((prop) => [prop, computed[prop]]));

      // Track per-signature occurrence index so downstream matching can
      // pair the Nth live instance with the Nth test instance.
      if (!signatureCounter.has(signature)) signatureCounter.set(signature, 0);
      const occurrenceIndex = signatureCounter.get(signature);
      signatureCounter.set(signature, occurrenceIndex + 1);

      const entry = {
        tag,
        text,
        signature,
        occurrenceIndex,
        style,
        rect: {
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left + window.scrollX),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      };

      if (tag === 'IMG') {
        entry.naturalWidth = element.naturalWidth || 0;
        entry.naturalHeight = element.naturalHeight || 0;
        entry.renderedWidth = Math.round(rect.width);
        entry.renderedHeight = Math.round(rect.height);
      }

      // Ancestor style capture: walk up to the nearest visual container and
      // record its key properties so we can catch mismatches on wrapper elements
      // (e.g. a button wrapper with borderRadius that the text child doesn't have).
      const ANCESTOR_PROPS = ['borderRadius', 'backgroundColor', 'boxShadow', 'padding'];
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

    return {
      title,
      headings,
      headingSequence: elements
        .filter((element) => ['H1', 'H2', 'H3', 'H4'].includes(element.tag))
        .map((element) => `${element.tag}:${element.text}`),
      elements,
      pageBg,
    };
  }, STYLE_PROPS);
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
      var known = ['hero', 'container', 'card', 'button', 'icon', 'eyebrow', 'slot', 'bubble', 'banner'];
      return known.indexOf(c) >= 0;
    }

    function isVisible(el) {
      var rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return false;
      var st = window.getComputedStyle(el);
      return st.display !== 'none' && st.visibility !== 'hidden' && Number(st.opacity) > 0;
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
        // Find the first semantic class name
        for (var j = 0; j < el.classList.length; j++) {
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
  // When counts differ, fall back to proximity-based best-match.
  function proximityScore(a, b) {
    return (
      Math.abs((a.rect.top || 0) - (b.rect.top || 0)) +
      Math.abs((a.rect.left || 0) - (b.rect.left || 0)) * 0.5 +
      Math.abs((a.rect.width || 0) - (b.rect.width || 0)) * 0.3 +
      Math.abs((a.rect.height || 0) - (b.rect.height || 0)) * 0.3
    );
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
      // Proximity-based matching for unequal counts
      const usedLive = new Set();
      for (const testEl of testEls) {
        let bestIdx = -1;
        let bestScore = Infinity;
        for (let i = 0; i < liveEls.length; i++) {
          if (usedLive.has(i)) continue;
          const score = proximityScore(liveEls[i], testEl);
          if (score < bestScore) { bestScore = score; bestIdx = i; }
        }
        if (bestIdx < 0) continue;
        usedLive.add(bestIdx);
        matched.push(buildMatchedEntry(key, liveEls[bestIdx], testEl));
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
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0;
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

        // Click to open dropdown
        await handle.click({ delay: 50 });
        await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));

        // Extract revealed dropdown content
        const dropdownContent = await page.evaluate((el) => {
          // Look for sibling/child dropdown panel that became visible after click
          const parent = el.parentElement;
          if (!parent) return null;
          const candidates = parent.querySelectorAll('[class*="dropdown"], [role="menu"], [role="listbox"], [data-wf-el*="dropdown"], ul, div');
          for (const candidate of candidates) {
            if (candidate === el) continue;
            const style = window.getComputedStyle(candidate);
            const rect = candidate.getBoundingClientRect();
            if (rect.width < 10 || rect.height < 10) continue;
            if (style.display === 'none') continue;
            if (style.visibility === 'hidden' && Number(style.opacity) === 0) continue;

            // Found a visible dropdown panel - extract its content
            const links = Array.from(candidate.querySelectorAll('a')).map((a) => ({
              text: (a.innerText || '').trim().slice(0, 80),
              href: a.getAttribute('href') || '',
            })).filter((l) => l.text);
            const headings = Array.from(candidate.querySelectorAll('div, span, h1, h2, h3, h4, h5, h6'))
              .filter((h) => {
                const s = window.getComputedStyle(h);
                return s.fontWeight >= 600 || s.textTransform === 'uppercase';
              })
              .map((h) => (h.innerText || '').trim().slice(0, 80))
              .filter(Boolean);

            const cStyle = window.getComputedStyle(candidate);
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
            };
          }
          return null;
        }, handle);

        // Click again to close dropdown
        await handle.click({ delay: 50 });
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

  // Test-only dropdowns
  for (const [label, test] of testMap) {
    if (!liveMap.has(label) && test.hasDropdown) {
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
    cursor: { label: 'Cursor style', count: 0, examples: [] },
    opacity: { label: 'Opacity', count: 0, examples: [] },
    boxShadow: { label: 'Box shadow', count: 0, examples: [] },
    other: { label: 'Other', count: 0, examples: [] },
  };

  for (const route of routes) {
    for (const item of route.checklist || []) {
      for (const diff of item.styleDiffs || []) {
        const prop = diff.split(':')[0].trim();
        const cat = categories[prop] || categories.other;
        cat.count += 1;
        if (cat.examples.length < 3) {
          cat.examples.push({ route: route.path, signature: item.signature, diff });
        }
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

  // Match within each tag group by index
  for (const tag of Object.keys(liveByTag)) {
    const liveGroup = liveByTag[tag] || [];
    const testGroup = testByTag[tag] || [];
    const maxIdx = Math.min(liveGroup.length, testGroup.length);

    for (let i = 0; i < maxIdx; i++) {
      const live = liveGroup[i];
      const test = testGroup[i];
      const propDiffs = [];

      for (const prop of CONTAINER_STYLE_PROPS) {
        const diff = compareStyleValue(prop, live.style?.[prop], test.style?.[prop], live.style, test.style);
        if (diff) propDiffs.push(diff);
      }

      if (propDiffs.length > 0) {
        diffs.push({
          index: live.index,
          liveLabel: live.label,
          testLabel: test.label,
          tag: live.tag,
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

function analyzeHeadingSequence(liveSequence, testSequence) {
  if (JSON.stringify(liveSequence) === JSON.stringify(testSequence)) {
    return { matches: true, diffs: [] };
  }

  const diffs = [];
  const maxLength = Math.max(liveSequence.length, testSequence.length);
  for (let index = 0; index < maxLength; index += 1) {
    if (liveSequence[index] === testSequence[index]) continue;
    diffs.push(`index ${index + 1}: live=${liveSequence[index] || '∅'} test=${testSequence[index] || '∅'}`);
    if (diffs.length >= 8) break;
  }

  return { matches: false, diffs };
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
    // Unequal counts → globally-sorted one-to-one assignment
    const candidates = [];
    for (let i = 0; i < liveInstances.length; i++) {
      for (let j = 0; j < testInstances.length; j++) {
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
        ? compareStyles(li.style, ti.style)
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
        liveInteractive: li.interactive || null,
        testInteractive: ti ? (ti.interactive || null) : null,
        liveAncestorStyle: li.ancestorStyle || null,
        testAncestorStyle: ti ? (ti.ancestorStyle || null) : null,
        styleDiffs,
        layoutDiffs,
        interactivityDiffs,
        ancestorDiffs,
        passed: hasTest && styleDiffs.length === 0 &&
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

  // Image dimension comparison
  const imageDiffs = [];
  const liveImages = livePage.inventory.elements.filter((el) => el.tag === 'IMG' && el.renderedWidth);
  const testImages = testPage.inventory.elements.filter((el) => el.tag === 'IMG' && el.renderedWidth);
  for (const liveImg of liveImages) {
    const testImg = testImages.find((t) => t.signature === liveImg.signature);
    if (!testImg) continue;
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
    testHeadings: testPage.inventory.headings,
    headingSequenceMatches: headingSequence.matches,
    headingSequenceDiffs: headingSequence.diffs,
    checklist,
    extraElements,
    missingElementsCount: checklist.filter((item) => item.testStyle === null).length,
    styleMismatchCount: checklist.filter((item) => item.styleDiffs.length > 0).length,
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
    wfMissingCount: wfComparison.missingOnTest.length,
    wfExtraCount: wfComparison.extraOnTest.length,
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
  lines.push(`- Webflow element style mismatches (data-wf-el): ${report.summary.wfElementMismatches || 0}`);
  lines.push(`- Webflow elements unmatched on test: ${report.summary.wfElementsMissing || 0}`);
  lines.push(`- Webflow elements extra on test: ${report.summary.wfElementsExtra || 0}`);
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

    for (const item of route.checklist) {
      const details = [];
      if (item.testStyle === null) {
        details.push('missing on test');
      }
      if (item.styleDiffs.length > 0) {
        details.push(`appearance mismatch: ${item.styleDiffs.join('; ')}`);
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

async function loadPage(page, origin, routePath) {
  const pageTimeout = 30000;
  const extractTimeout = 20000;
  const url = new URL(routePath, origin).toString();

  const response = await withTimeout(
    page.goto(url, { waitUntil: 'load', timeout: pageTimeout }),
    pageTimeout + 5000,
    `goto ${url}`,
  );

  await withTimeout(
    page.evaluate(() => new Promise((r) => setTimeout(r, 2000))),
    10000,
    `settle delay ${url}`,
  );

  const isLiveSite = origin === LIVE_ORIGIN;
  const [inventory, containers, interactive, cssVars, wfElements] = await withTimeout(
    Promise.all([
      extractPageInventory(page),
      extractContainerStyles(page),
      extractInteractivity(page),
      extractCSSCustomProperties(page),
      extractWebflowElements(page, isLiveSite),
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
  };
}

async function discoverPaths(browser) {
  const seeds = await getSitemapPaths(LIVE_ORIGIN);
  const discovered = new Set(seeds.length > 0 ? seeds : ['/']);
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
        const [liveData, testData] = await Promise.all([
          loadPage(livePage, LIVE_ORIGIN, routePath),
          loadPage(testPage, TEST_ORIGIN, routePath),
        ]);
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

        routes.push(summarizeRouteComparison(routePath, liveData, testData, screenshotDiff));
        console.log(`Compared ${routePath}`);
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
        wfElementsMissing: routes.reduce((total, route) => total + (route.wfMissingCount || 0), 0),
        wfElementsExtra: routes.reduce((total, route) => total + (route.wfExtraCount || 0), 0),
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
