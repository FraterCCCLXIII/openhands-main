#!/usr/bin/env node
/**
 * Visual Comparison Validator
 *
 * Pixel-level screenshot comparison between live and test sites.
 * Uses pixelmatch for proper image comparison including transparency detection.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const LIVE_URL = 'https://openhands.dev';
const TEST_URL = process.env.TEST_URL || 'http://localhost:12001';
const OUTPUT_DIR = '/tmp/visual-comparison';

async function captureFullPage(page, name) {
  const screenshots = [];
  const viewportHeight = 900;

  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const scrollPositions = Math.ceil(totalHeight / viewportHeight);

  for (let i = 0; i < Math.min(scrollPositions, 10); i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * viewportHeight);
    await new Promise(r => setTimeout(r, 300));

    const filename = `${name}-${i}.png`;
    await page.screenshot({ path: path.join(OUTPUT_DIR, filename) });
    screenshots.push(filename);
  }

  return screenshots;
}

function comparePixels(img1Path, img2Path, diffPath) {
  const img1 = PNG.sync.read(fs.readFileSync(img1Path));
  const img2 = PNG.sync.read(fs.readFileSync(img2Path));

  const width = Math.max(img1.width, img2.width);
  const height = Math.max(img1.height, img2.height);
  const diff = new PNG({ width, height });

  // Resize images if needed (pad with transparent)
  const resizeImage = (img, w, h) => {
    if (img.width === w && img.height === h) return img.data;
    const newData = Buffer.alloc(w * h * 4, 0);
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const srcIdx = (y * img.width + x) * 4;
        const dstIdx = (y * w + x) * 4;
        newData[dstIdx] = img.data[srcIdx];
        newData[dstIdx + 1] = img.data[srcIdx + 1];
        newData[dstIdx + 2] = img.data[srcIdx + 2];
        newData[dstIdx + 3] = img.data[srcIdx + 3];
      }
    }
    return newData;
  };

  const data1 = resizeImage(img1, width, height);
  const data2 = resizeImage(img2, width, height);

  // Compare with pixelmatch - detects transparency, color differences
  const numDiffPixels = pixelmatch(data1, data2, diff.data, width, height, {
    threshold: 0.1,  // Lower = more sensitive
    includeAA: true,
    alpha: 0.3,
  });

  const totalPixels = width * height;
  const diffPercent = (numDiffPixels / totalPixels) * 100;

  // Save diff image for visual inspection
  if (diffPath && numDiffPixels > 0) {
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
  }

  return {
    match: diffPercent < 0.5,
    diffPixels: numDiffPixels,
    totalPixels,
    diffPercent: diffPercent.toFixed(2),
    reason: diffPercent >= 0.5 ? `${diffPercent.toFixed(2)}% pixels differ (${numDiffPixels} of ${totalPixels})` : null
  };
}

async function main() {
  console.log('📸 Visual Screenshot Comparison (with pixelmatch)');
  console.log('==================================================\n');
  console.log(`Live: ${LIVE_URL}`);
  console.log(`Test: ${TEST_URL}\n`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const [livePage, testPage] = await Promise.all([
      browser.newPage(),
      browser.newPage(),
    ]);

    // Block PostHog on live site to get consistent (non-A/B-tested) content
    await livePage.setRequestInterception(true);
    livePage.on('request', (req) => {
      if (req.url().includes('posthog')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await livePage.setViewport({ width: 1440, height: 900 });
    await testPage.setViewport({ width: 1440, height: 900 });

    console.log('Loading pages (blocking PostHog A/B tests)...');
    await Promise.all([
      livePage.goto(LIVE_URL, { waitUntil: 'networkidle0', timeout: 30000 }),
      testPage.goto(TEST_URL, { waitUntil: 'networkidle0', timeout: 30000 }),
    ]);

    console.log('Capturing screenshots...\n');
    const [liveScreenshots, testScreenshots] = await Promise.all([
      captureFullPage(livePage, 'live'),
      captureFullPage(testPage, 'test'),
    ]);

    console.log(`Captured ${liveScreenshots.length} live, ${testScreenshots.length} test screenshots\n`);

    // Compare screenshots
    const results = [];
    const count = Math.min(liveScreenshots.length, testScreenshots.length);

    for (let i = 0; i < count; i++) {
      const livePath = path.join(OUTPUT_DIR, liveScreenshots[i]);
      const testPath = path.join(OUTPUT_DIR, testScreenshots[i]);
      const diffPath = path.join(OUTPUT_DIR, `diff-${i}.png`);

      const result = comparePixels(livePath, testPath, diffPath);
      results.push(result);

      const status = result.match ? '✅' : '❌';
      const detail = result.match
        ? `${result.diffPercent}% diff`
        : result.reason;
      console.log(`${status} Screenshot ${i + 1} (Y: ${i * 900}-${(i + 1) * 900}px): ${detail}`);
    }

    console.log(`\n📁 Screenshots saved to: ${OUTPUT_DIR}`);
    console.log('   Compare: live-N.png vs test-N.png');
    console.log('   Diff images: diff-N.png (red = different pixels)\n');

    const failures = results.filter(r => !r.match).length;
    console.log(`\n${failures === 0 ? '✅' : '❌'} ${failures} of ${results.length} screenshots have significant differences`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
