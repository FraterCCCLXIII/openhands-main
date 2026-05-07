#!/usr/bin/env node
/**
 * Dumps a hierarchical outline of a route's visible sections + key elements
 * with bounding boxes. Useful for side-by-side comparison of live vs test
 * pages to find missing/different content in a focused way.
 *
 * Usage:
 *   ROUTE=/about node scripts/dump-section-outline.cjs https://openhands.dev http://127.0.0.1:12001
 */
const puppeteer = require('puppeteer');

async function dump(origin, route) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  });
  try {
    const page = await browser.newPage();
    await page.goto(`${origin}${route}`, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForFunction(() => document.fonts && document.fonts.ready, { timeout: 10000 }).catch(() => {});
    // Wait for any deferred paints
    await new Promise(r => setTimeout(r, 1500));
    const data = await page.evaluate(() => {
      const out = [];
      const main = document.querySelector('main') || document.body;
      // Collect direct + nested SECTION elements + their key descendants
      const sections = Array.from(main.querySelectorAll('section, [class*="page-main"]'));
      for (const sec of sections) {
        const r = sec.getBoundingClientRect();
        if (r.height < 40) continue;
        const cls = (sec.className || '').toString().slice(0, 60);
        const wf = sec.getAttribute('data-wf-el') || '';
        // Get heading + image stats
        const headings = Array.from(sec.querySelectorAll('h1,h2,h3,h4,h5')).map(h => {
          const hr = h.getBoundingClientRect();
          return {
            tag: h.tagName,
            text: (h.innerText || '').trim().slice(0, 50),
            top: Math.round(hr.top + scrollY),
            h: Math.round(hr.height),
          };
        });
        const imgs = sec.querySelectorAll('img').length;
        const paragraphs = sec.querySelectorAll('p').length;
        const links = sec.querySelectorAll('a').length;
        out.push({
          tag: sec.tagName,
          wfEl: wf,
          cls,
          top: Math.round(r.top + scrollY),
          h: Math.round(r.height),
          headings,
          imgs,
          paragraphs,
          links,
        });
      }
      // Page main height
      const m = main.getBoundingClientRect();
      return { mainHeight: Math.round(m.height), bodyScrollHeight: Math.round(document.body.scrollHeight), sections: out };
    });
    return data;
  } finally {
    await browser.close();
  }
}

async function main() {
  const [liveOrigin, testOrigin] = process.argv.slice(2);
  const route = process.env.ROUTE || '/';
  if (!liveOrigin || !testOrigin) {
    console.error('Usage: ROUTE=/path node dump-section-outline.cjs <liveOrigin> <testOrigin>');
    process.exit(1);
  }
  console.error(`Comparing ${route}: live=${liveOrigin} test=${testOrigin}`);
  const [live, test] = await Promise.all([dump(liveOrigin, route), dump(testOrigin, route)]);
  const fmt = (s) => `${s.tag}${s.wfEl ? '['+s.wfEl+']' : ''} top=${s.top} h=${s.h} | h=${s.headings.length} img=${s.imgs} p=${s.paragraphs} a=${s.links} | hdrs=${s.headings.map(h=>`${h.tag}:${h.text}`).join(' / ').slice(0,140)}`;
  console.log(`\n=== LIVE ${route} (mainH=${live.mainHeight}) ===`);
  for (const s of live.sections) console.log(fmt(s));
  console.log(`\n=== TEST ${route} (mainH=${test.mainHeight}) ===`);
  for (const s of test.sections) console.log(fmt(s));
}

main().catch(e => { console.error(e); process.exit(1); });
