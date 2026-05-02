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
const VIEWPORT = { width: 1440, height: 2400 };
const PROTOCOL_TIMEOUT = Number(
  process.env.PARITY_PROTOCOL_TIMEOUT || process.env.PARITY_PROTOCOL_TIMEOUT_MS || 300000,
);
const SCREENSHOT_PAGE_LIMIT = Number(process.env.PARITY_SCREENSHOT_PAGE_LIMIT || Math.min(MAX_PAGES, 20));
const SCREENSHOT_DIFF_THRESHOLD = Number(process.env.PARITY_SCREENSHOT_DIFF_THRESHOLD || 2);
const SCREENSHOT_CHUNK_HEIGHT = Number(process.env.PARITY_SCREENSHOT_CHUNK_HEIGHT || 6000);
const SCREENSHOT_CHUNK_TRIGGER_HEIGHT = Number(process.env.PARITY_SCREENSHOT_CHUNK_TRIGGER_HEIGHT || 12000);
const STYLE_PROPS = [
  'fontSize',
  'fontFamily',
  'fontWeight',
  'lineHeight',
  'color',
  'backgroundColor',
  'borderRadius',
  'backgroundImage',
  'cursor',
  'textDecoration',
  'letterSpacing',
];
const STYLE_CHECK_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'A', 'BUTTON', 'LABEL', 'INPUT', 'IMG', 'P', 'SPAN']);
const LAYOUT_CHECK_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'A', 'BUTTON', 'LABEL', 'INPUT', 'IMG', 'P']);

const CONTAINER_STYLE_PROPS = [
  'backgroundColor',
  'backgroundImage',
  'borderRadius',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
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

function primaryFontMatches(liveValue, testValue) {
  const liveFonts = normalizeFontFamily(liveValue);
  const testFonts = normalizeFontFamily(testValue);
  if (liveFonts.length === 0 && testFonts.length === 0) return true;
  if (liveFonts.length === 0 || testFonts.length === 0) return false;
  return liveFonts[0] === testFonts[0];
}

function normalizeTransition(value) {
  if (!value || value === 'none' || value === 'all 0s ease 0s') return 'none';
  return value;
}

function compareStyleValue(prop, liveValue, testValue) {
  if (liveValue === testValue) return null;

  if (prop === 'fontFamily') {
    if (primaryFontMatches(liveValue, testValue)) return null;
    const livePrimary = normalizeFontFamily(liveValue)[0] || '(none)';
    const testPrimary = normalizeFontFamily(testValue)[0] || '(none)';
    return `fontFamily: live=${livePrimary} test=${testPrimary}`;
  }

  if (prop === 'color' || prop === 'backgroundColor') {
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

  if (prop === 'textDecoration') {
    const normalize = (v) => (v || 'none').replace(/\s+/g, ' ').trim().toLowerCase();
    if (normalize(liveValue) === normalize(testValue)) return null;
  }

  if (prop === 'letterSpacing') {
    if ((liveValue === 'normal' && testValue === '0px') ||
        (liveValue === '0px' && testValue === 'normal')) return null;
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
    const diff = compareStyleValue(prop, liveStyle?.[prop], testStyle?.[prop]);
    if (diff) diffs.push(diff);
  }
  return diffs;
}

function compareLayout(tag, liveRect, testRect) {
  if (!liveRect || !testRect) return [];

  const tolerance = {
    top: tag === 'IMG' ? 140 : tag.startsWith('H') ? 90 : tag === 'P' ? 80 : 70,
    left: tag === 'IMG' ? 120 : 80,
    width: tag === 'IMG' ? 140 : 120,
    height: tag === 'IMG' ? 140 : 100,
  };

  const diffs = [];
  for (const key of ['top', 'left', 'width', 'height']) {
    const delta = Math.abs((liveRect[key] || 0) - (testRect[key] || 0));
    if (delta > tolerance[key]) {
      diffs.push(`${key}: live=${liveRect[key]} test=${testRect[key]}`);
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
    ].join(',');

    const normalizeWhitespaceInner = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const normalizeTextInner = (value) => normalizeWhitespaceInner(value).toLowerCase();
    const elements = [];

    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return false;

      let current = element;
      while (current) {
        const style = window.getComputedStyle(current);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
          return false;
        }
        if (current.hasAttribute('hidden') || current.getAttribute('aria-hidden') === 'true') {
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
      if (!normalizedText) return;
      if (normalizedText.startsWith('http://') || normalizedText.startsWith('https://')) return;

      const computed = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const signature = `${tag}:${normalizedText.slice(0, 140)}`;
      const style = Object.fromEntries(styleProps.map((prop) => [prop, computed[prop]]));

      elements.push({
        tag,
        text,
        signature,
        style,
        rect: {
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left + window.scrollX),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      });
    });

    const title = document.title || '';
    const headings = {};
    for (const tag of ['H1', 'H2', 'H3']) {
      headings[tag] = elements.filter((element) => element.tag === tag).map((element) => element.text);
    }

    return {
      title,
      headings,
      headingSequence: elements
        .filter((element) => ['H1', 'H2', 'H3', 'H4'].includes(element.tag))
        .map((element) => `${element.tag}:${element.text}`),
      elements,
    };
  }, STYLE_PROPS);
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

function compareContainerStyles(liveContainers, testContainers) {
  const diffs = [];
  const maxIndex = Math.min(liveContainers.length, testContainers.length);

  for (let i = 0; i < maxIndex; i++) {
    const live = liveContainers[i];
    const test = testContainers[i];
    const propDiffs = [];

    for (const prop of CONTAINER_STYLE_PROPS) {
      const diff = compareStyleValue(prop, live.style?.[prop], test.style?.[prop]);
      if (diff) propDiffs.push(diff);
    }

    if (propDiffs.length > 0) {
      diffs.push({
        index: i,
        liveLabel: live.label,
        testLabel: test.label,
        tag: live.tag,
        diffs: propDiffs,
        passed: false,
      });
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
  const liveMap = new Map();
  for (const element of livePage.inventory.elements) {
    const existing = liveMap.get(element.signature) || {
      signature: element.signature,
      tag: element.tag,
      text: element.text,
      liveCount: 0,
      testCount: 0,
      liveStyle: element.style,
      testStyle: null,
      liveRect: element.rect,
      testRect: null,
      styleDiffs: [],
      layoutDiffs: [],
    };
    existing.liveCount += 1;
    liveMap.set(element.signature, existing);
  }

  const testMap = new Map();
  for (const element of testPage.inventory.elements) {
    const existing = testMap.get(element.signature) || {
      count: 0,
      style: element.style,
      rect: element.rect,
      tag: element.tag,
      text: element.text,
    };
    existing.count += 1;
    if (!existing.style) existing.style = element.style;
    if (!existing.rect) existing.rect = element.rect;
    testMap.set(element.signature, existing);
  }

  const checklist = Array.from(liveMap.values())
    .map((item) => {
      const testMatch = testMap.get(item.signature);
      item.testCount = testMatch?.count || 0;
      item.testStyle = testMatch?.style || null;
      item.testRect = testMatch?.rect || null;
      item.styleDiffs = item.testCount > 0 && STYLE_CHECK_TAGS.has(item.tag)
        ? compareStyles(item.liveStyle, item.testStyle)
        : [];
      item.layoutDiffs = item.testCount > 0 && LAYOUT_CHECK_TAGS.has(item.tag)
        ? compareLayout(item.tag, item.liveRect, item.testRect)
        : [];
      return {
        ...item,
        passed: item.testCount >= item.liveCount && item.styleDiffs.length === 0 && item.layoutDiffs.length === 0,
      };
    })
    .sort((left, right) => left.signature.localeCompare(right.signature));

  const extraElements = Array.from(testMap.entries())
    .filter(([signature]) => !liveMap.has(signature))
    .map(([signature, item]) => ({
      signature,
      tag: item.tag,
      text: item.text,
      count: item.count,
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
    missingElementsCount: checklist.filter((item) => item.testCount < item.liveCount).length,
    styleMismatchCount: checklist.filter((item) => item.styleDiffs.length > 0).length,
    layoutMismatchCount: checklist.filter((item) => item.layoutDiffs.length > 0).length,
    extraElementsCount: extraElements.length,
    containerDiffs,
    containerMismatchCount: containerDiffs.length,
    interactivity,
    missingInteractiveCount: interactivity.missingInteractive.length,
    interactivityDiffCount: interactivity.interactivityDiffs.length,
    extraInteractiveCount: interactivity.extraInteractive.length,
    hoverDiffs,
    hoverMismatchCount: hoverDiffs.length,
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
  lines.push(`- Missing interactive elements: ${report.summary.missingInteractive}`);
  lines.push(`- Interactivity behavior mismatches: ${report.summary.interactivityDiffs}`);
  lines.push(`- Hover effect mismatches: ${report.summary.hoverMismatches}`);
  lines.push(`- Screenshot mismatches (> ${SCREENSHOT_DIFF_THRESHOLD}% or unavailable): ${report.summary.screenshotMismatches}`);
  lines.push(`- Screenshot capture failures: ${report.summary.screenshotUnavailable || 0}`);
  lines.push(`- Total failing checks: ${report.summary.failedChecklistItems}`);
  lines.push('');

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
      if (item.testCount < item.liveCount) {
        details.push(`missing count ${item.liveCount - item.testCount}`);
      }
      if (item.styleDiffs.length > 0) {
        details.push(`appearance mismatch: ${item.styleDiffs.join('; ')}`);
      }
      if (item.layoutDiffs.length > 0) {
        details.push(`layout mismatch: ${item.layoutDiffs.join('; ')}`);
      }
      const suffix = details.length > 0 ? ` — ${details.join(' | ')}` : '';
      lines.push(`- [${item.passed ? 'x' : ' '}] ${item.signature}${suffix}`);
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

    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function loadPage(page, origin, routePath) {
  const response = await page.goto(new URL(routePath, origin).toString(), {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });
  const [inventory, containers, interactive] = await Promise.all([
    extractPageInventory(page),
    extractContainerStyles(page),
    extractInteractivity(page),
  ]);

  let hoverEffects = [];
  try {
    hoverEffects = await extractHoverDiffs(page, 'a[href], button, [role="button"], [role="tab"]');
  } catch {
    // hover extraction is best-effort
  }

  return {
    status: response?.status() || 0,
    inventory,
    containers,
    interactive,
    hoverEffects,
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
        waitUntil: 'networkidle0',
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

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: PROTOCOL_TIMEOUT,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const paths = await discoverPaths(browser);
    const routes = [];

    for (const [index, routePath] of paths.entries()) {
      const [livePage, testPage] = await Promise.all([browser.newPage(), browser.newPage()]);

      try {
        await Promise.all([livePage.setViewport(VIEWPORT), testPage.setViewport(VIEWPORT)]);
        const [liveData, testData] = await Promise.all([
          loadPage(livePage, LIVE_ORIGIN, routePath),
          loadPage(testPage, TEST_ORIGIN, routePath),
        ]);

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
        await Promise.all([livePage.close(), testPage.close()]);
      }
    }

    const report = {
      generatedAt: new Date().toISOString(),
      liveOrigin: LIVE_ORIGIN,
      testOrigin: TEST_ORIGIN,
      summary: {
        routeMismatches: routes.filter((route) => route.testStatus >= 400 || route.liveStatus >= 400).length,
        titleMismatches: routes.filter((route) => !route.titleMatches).length,
        headingSequenceMismatches: routes.filter((route) => !route.headingSequenceMatches).length,
        missingElements: routes.reduce((total, route) => total + route.missingElementsCount, 0),
        extraElements: routes.reduce((total, route) => total + route.extraElementsCount, 0),
        styleMismatches: routes.reduce((total, route) => total + route.styleMismatchCount, 0),
        layoutMismatches: routes.reduce((total, route) => total + route.layoutMismatchCount, 0),
        containerMismatches: routes.reduce((total, route) => total + (route.containerMismatchCount || 0), 0),
        missingInteractive: routes.reduce((total, route) => total + (route.missingInteractiveCount || 0), 0),
        interactivityDiffs: routes.reduce((total, route) => total + (route.interactivityDiffCount || 0), 0),
        hoverMismatches: routes.reduce((total, route) => total + (route.hoverMismatchCount || 0), 0),
        screenshotMismatches: routes.filter((route) => route.screenshotDiff && !route.screenshotDiff.passed).length,
        screenshotUnavailable: routes.filter((route) => route.screenshotDiff?.error).length,
      },
      routes,
    };

    report.summary.failedChecklistItems =
      report.summary.routeMismatches +
      report.summary.titleMismatches +
      report.summary.headingSequenceMismatches +
      report.summary.missingElements +
      report.summary.extraElements +
      report.summary.styleMismatches +
      report.summary.layoutMismatches +
      report.summary.containerMismatches +
      report.summary.missingInteractive +
      report.summary.interactivityDiffs +
      report.summary.hoverMismatches +
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
  compareContainerStyles,
  compareHoverEffects,
  compareInteractivity,
  compareStyleValue,
  copyPngInto,
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
