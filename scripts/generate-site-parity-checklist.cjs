#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const puppeteer = require('puppeteer');

const LIVE_ORIGIN = process.env.LIVE_ORIGIN || 'https://openhands.dev';
const TEST_ORIGIN = process.env.TEST_ORIGIN || process.argv[2] || 'http://localhost:12001';
const OUTPUT_DIR = path.resolve(
  process.cwd(),
  process.env.PARITY_OUTPUT_DIR || '.agent_tmp/parity',
);
const MAX_PAGES = Number(process.env.PARITY_MAX_PAGES || 200);
const DISCOVERY_PAGE_LIMIT = Number(process.env.PARITY_DISCOVERY_LIMIT || 60);
const VIEWPORT = { width: 1440, height: 2400 };
const STYLE_PROPS = ['fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor', 'borderRadius'];
const STYLE_CHECK_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'A', 'BUTTON', 'LABEL', 'INPUT', 'IMG']);

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

function signatureLabel(signature) {
  return signature.replace(/^[A-Z0-9_]+:/, '');
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

function compareStyleValue(prop, liveValue, testValue) {
  if (liveValue === testValue) return null;

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

  const livePx = parsePx(liveValue);
  const testPx = parsePx(testValue);
  if (livePx !== null && testPx !== null) {
    const toleranceByProp = {
      fontSize: 2,
      fontWeight: 100,
      lineHeight: 3,
      borderRadius: 3,
    };
    const tolerance = toleranceByProp[prop] || 2;
    if (Math.abs(livePx - testPx) <= tolerance) return null;
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

    const nodes = document.querySelectorAll(selectors);
    nodes.forEach((element) => {
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
      const signature = `${tag}:${normalizedText.slice(0, 140)}`;
      const style = Object.fromEntries(styleProps.map((prop) => [prop, computed[prop]]));

      elements.push({
        tag,
        text,
        signature,
        style,
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
      elements,
    };
  }, STYLE_PROPS);
}

function summarizeRouteComparison(routePath, livePage, testPage) {
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
      styleDiffs: [],
    };
    existing.liveCount += 1;
    liveMap.set(element.signature, existing);
  }

  const testMap = new Map();
  for (const element of testPage.inventory.elements) {
    const existing = testMap.get(element.signature) || {
      count: 0,
      style: element.style,
    };
    existing.count += 1;
    if (!existing.style) existing.style = element.style;
    testMap.set(element.signature, existing);
  }

  const checklist = Array.from(liveMap.values())
    .map((item) => {
      const testMatch = testMap.get(item.signature);
      item.testCount = testMatch?.count || 0;
      item.testStyle = testMatch?.style || null;
      item.styleDiffs =
        item.testCount > 0 && STYLE_CHECK_TAGS.has(item.tag)
          ? compareStyles(item.liveStyle, item.testStyle)
          : [];
      return {
        ...item,
        passed: item.testCount >= item.liveCount && item.styleDiffs.length === 0,
      };
    })
    .sort((left, right) => left.signature.localeCompare(right.signature));

  const missingElements = checklist.filter((item) => item.testCount < item.liveCount);
  const styleMismatches = checklist.filter(
    (item) => item.testCount >= item.liveCount && item.styleDiffs.length > 0,
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
    checklist,
    missingElementsCount: missingElements.length,
    styleMismatchCount: styleMismatches.length,
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
  lines.push(`- Element checklist items failing: ${report.summary.failedChecklistItems}`);
  lines.push(`- Missing element signatures: ${report.summary.missingElements}`);
  lines.push(`- Appearance mismatches: ${report.summary.styleMismatches}`);
  lines.push('');

  for (const route of report.routes) {
    lines.push(`## ${route.path}`);
    lines.push('');
    lines.push(
      `- [${route.testStatus < 400 ? 'x' : ' '}] Route exists on company-website (${route.liveStatus} vs ${route.testStatus})`,
    );
    lines.push(
      `- [${route.titleMatches ? 'x' : ' '}] Title matches${route.titleMatches ? '' : ` (live: ${route.liveTitle} | test: ${route.testTitle})`}`,
    );

    for (const item of route.checklist) {
      const details = [];
      if (item.testCount < item.liveCount) {
        details.push(`missing count ${item.liveCount - item.testCount}`);
      }
      if (item.styleDiffs.length > 0) {
        details.push(`appearance mismatch: ${item.styleDiffs.join('; ')}`);
      }
      const suffix = details.length > 0 ? ` — ${details.join(' | ')}` : '';
      lines.push(`- [${item.passed ? 'x' : ' '}] ${item.signature}${suffix}`);
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
  const inventory = await extractPageInventory(page);
  return {
    status: response?.status() || 0,
    inventory,
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
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const paths = await discoverPaths(browser);
    const routes = [];

    for (const routePath of paths) {
      const [livePage, testPage] = await Promise.all([
        browser.newPage(),
        browser.newPage(),
      ]);

      try {
        await Promise.all([livePage.setViewport(VIEWPORT), testPage.setViewport(VIEWPORT)]);
        const [liveData, testData] = await Promise.all([
          loadPage(livePage, LIVE_ORIGIN, routePath),
          loadPage(testPage, TEST_ORIGIN, routePath),
        ]);
        routes.push(summarizeRouteComparison(routePath, liveData, testData));
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
        routeMismatches: routes.filter(
          (route) => route.testStatus >= 400 || route.liveStatus >= 400,
        ).length,
        titleMismatches: routes.filter((route) => !route.titleMatches).length,
        failedChecklistItems: routes.reduce(
          (total, route) => total + route.checklist.filter((item) => !item.passed).length,
          0,
        ),
        missingElements: routes.reduce((total, route) => total + route.missingElementsCount, 0),
        styleMismatches: routes.reduce((total, route) => total + route.styleMismatchCount, 0),
      },
      routes,
    };

    const jsonPath = path.join(OUTPUT_DIR, 'site-parity-checklist.json');
    const markdownPath = path.join(OUTPUT_DIR, 'site-parity-checklist.md');

    await Promise.all([
      fs.writeFile(jsonPath, JSON.stringify(report, null, 2)),
      fs.writeFile(markdownPath, renderMarkdown(report)),
    ]);

    console.log(`\nWrote JSON report to ${jsonPath}`);
    console.log(`Wrote Markdown checklist to ${markdownPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
