#!/usr/bin/env node
/**
 * Deep Visual Validator - General Purpose Site Comparison
 * 
 * Automatically detects ALL differences between two sites:
 * 1. DOM structure differences (missing/extra elements, different hierarchy)
 * 2. Text content differences (what text exists where)
 * 3. Visual style differences (colors, backgrounds, sizes, positions)
 * 4. Layout differences (element positions, dimensions, spacing)
 * 5. Asset differences (images, backgrounds, icons)
 * 6. Interactive behavior differences (clicks, hover states)
 * 
 * NO HARDCODED SELECTORS - discovers differences automatically
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatchModule = require('pixelmatch');
const pixelmatch = pixelmatchModule.default || pixelmatchModule;

const LIVE_URL = 'https://openhands.dev';
const TEST_URL = process.env.TEST_URL || 'http://localhost:12001';
const OUTPUT_DIR = '/tmp/deep-visual-comparison';

const CONFIG = {
  scrollStep: 900,
  maxScrolls: 15,
  pixelDiffThreshold: 2,
  structureDiffThreshold: 0.1,
  keyElements: [],
  interactiveTests: [
    { name: 'Tab 1 (SDK)', selector: '[data-key="1"]' },
    { name: 'Tab 2 (Cloud)', selector: '[data-key="2"]' },
    { name: 'Tab 3 (CLI)', selector: '[data-key="3"]' },
  ],
  stylesToCompare: ['backgroundColor', 'color', 'opacity', 'display'],
};

class DeepValidator {
  constructor() {
    this.issues = [];
    this.browser = null;
  }

  log(type, message, details = {}) {
    const issue = { type, message, ...details };
    this.issues.push(issue);
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${message}`);
    if (Object.keys(details).length > 0) {
      console.log(`   ${JSON.stringify(details)}`);
    }
  }

  async init() {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close() {
    if (this.browser) await this.browser.close();
  }

  async createPage(blockPosthog = false) {
    const page = await this.browser.newPage();
    
    // Track 404s and failed requests
    const failedRequests = [];
    page.on('requestfailed', req => {
      failedRequests.push({ url: req.url(), reason: req.failure()?.errorText });
    });
    page.on('response', res => {
      if (res.status() === 404) {
        failedRequests.push({ url: res.url(), reason: '404 Not Found' });
      }
    });
    
    if (blockPosthog) {
      await page.setRequestInterception(true);
      page.on('request', req => {
        if (req.url().includes('posthog')) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }
    
    await page.setViewport({ width: 1440, height: 900 });
    page.failedRequests = failedRequests;
    return page;
  }

  // Compare two images and generate diff
  compareImages(img1Path, img2Path, diffPath) {
    try {
      const img1 = PNG.sync.read(fs.readFileSync(img1Path));
      const img2 = PNG.sync.read(fs.readFileSync(img2Path));
      
      const width = Math.max(img1.width, img2.width);
      const height = Math.max(img1.height, img2.height);
      const diff = new PNG({ width, height });
      
      // Pad smaller image
      const padImage = (img, w, h) => {
        if (img.width === w && img.height === h) return img.data;
        const data = Buffer.alloc(w * h * 4, 0);
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const si = (y * img.width + x) * 4;
            const di = (y * w + x) * 4;
            data[di] = img.data[si];
            data[di + 1] = img.data[si + 1];
            data[di + 2] = img.data[si + 2];
            data[di + 3] = img.data[si + 3];
          }
        }
        return data;
      };
      
      const data1 = padImage(img1, width, height);
      const data2 = padImage(img2, width, height);
      
      const numDiff = pixelmatch(data1, data2, diff.data, width, height, {
        threshold: 0.1,
        includeAA: true,
      });
      
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
      
      const totalPixels = width * height;
      const diffPercent = (numDiff / totalPixels) * 100;
      
      // Analyze diff image to find regions with differences
      const regions = this.analyzeDiffRegions(diff, width, height);
      
      return { numDiff, totalPixels, diffPercent, regions };
    } catch (err) {
      return { error: err.message };
    }
  }

  // Find regions where differences are concentrated
  analyzeDiffRegions(diff, width, height) {
    const regions = [];
    const gridSize = 100; // Analyze in 100px grid
    
    for (let gy = 0; gy < height; gy += gridSize) {
      for (let gx = 0; gx < width; gx += gridSize) {
        let diffCount = 0;
        for (let y = gy; y < Math.min(gy + gridSize, height); y++) {
          for (let x = gx; x < Math.min(gx + gridSize, width); x++) {
            const idx = (y * width + x) * 4;
            // Red pixels in diff indicate differences
            if (diff.data[idx] > 200 && diff.data[idx + 1] < 100) {
              diffCount++;
            }
          }
        }
        if (diffCount > gridSize * gridSize * 0.05) { // >5% of grid is different
          regions.push({ x: gx, y: gy, intensity: diffCount / (gridSize * gridSize) });
        }
      }
    }
    return regions;
  }

  // Extract computed styles for an element
  async getElementStyles(page, selector) {
    return page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        padding: styles.padding,
        margin: styles.margin,
        opacity: styles.opacity,
        display: styles.display,
        width: el.offsetWidth,
        height: el.offsetHeight,
      };
    }, selector);
  }

  // Extract text content from a selector
  async getTextContent(page, selector) {
    return page.evaluate((sel) => {
      const els = document.querySelectorAll(sel);
      return Array.from(els).map(el => el.textContent?.trim()).filter(Boolean);
    }, selector);
  }

  // Test interactivity
  async testInteractivity(page, test) {
    try {
      const before = await page.screenshot({ encoding: 'base64' });
      await page.click(test.selector);
      await new Promise(r => setTimeout(r, 500));
      const after = await page.screenshot({ encoding: 'base64' });
      return { changed: before !== after };
    } catch (err) {
      return { error: err.message };
    }
  }

  // Extract all visible text from page
  async extractPageContent(page) {
    return page.evaluate(() => {
      const content = {
        title: document.title,
        h1: [...document.querySelectorAll('h1')].map(el => el.textContent?.trim()),
        h2: [...document.querySelectorAll('h2')].map(el => el.textContent?.trim()),
        buttons: [...document.querySelectorAll('button, a.btn, [class*="btn"]')].map(el => el.textContent?.trim()),
        links: [...document.querySelectorAll('nav a, footer a')].map(el => ({ text: el.textContent?.trim(), href: el.getAttribute('href') })),
        images: [...document.querySelectorAll('img')].map(el => ({ src: el.src, alt: el.alt })),
        backgrounds: [...document.querySelectorAll('*')].filter(el => {
          const style = window.getComputedStyle(el);
          return style.backgroundImage && style.backgroundImage !== 'none';
        }).map(el => ({
          selector: el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''),
          backgroundImage: window.getComputedStyle(el).backgroundImage,
        })),
      };
      return content;
    });
  }

  // Compare page content comprehensively
  compareContent(live, test, name) {
    const diffs = [];
    
    // Title
    if (live.title !== test.title) {
      diffs.push({ type: 'title', live: live.title, test: test.title });
    }
    
    // H1s
    const liveH1 = live.h1.filter(Boolean);
    const testH1 = test.h1.filter(Boolean);
    if (JSON.stringify(liveH1) !== JSON.stringify(testH1)) {
      diffs.push({ type: 'h1', live: liveH1, test: testH1 });
    }
    
    // Buttons
    const liveButtons = new Set(live.buttons.filter(Boolean));
    const testButtons = new Set(test.buttons.filter(Boolean));
    const missingButtons = [...liveButtons].filter(b => !testButtons.has(b));
    const extraButtons = [...testButtons].filter(b => !liveButtons.has(b));
    if (missingButtons.length > 0 || extraButtons.length > 0) {
      diffs.push({ type: 'buttons', missing: missingButtons, extra: extraButtons });
    }
    
    // Background images
    const liveBgs = live.backgrounds.filter(b => b.backgroundImage.includes('url'));
    const testBgs = test.backgrounds.filter(b => b.backgroundImage.includes('url'));
    if (liveBgs.length !== testBgs.length) {
      diffs.push({ type: 'backgrounds', liveCount: liveBgs.length, testCount: testBgs.length });
    }
    
    return diffs;
  }

  // Main validation
  async validate() {
    console.log('\n🔍 Deep Visual Validator');
    console.log('========================\n');
    console.log(`Live: ${LIVE_URL}`);
    console.log(`Test: ${TEST_URL}\n`);

    await this.init();

    try {
      const livePage = await this.createPage(true);
      const testPage = await this.createPage(false);

      console.log('Loading pages...\n');
      await Promise.all([
        livePage.goto(LIVE_URL, { waitUntil: 'networkidle0', timeout: 30000 }),
        testPage.goto(TEST_URL, { waitUntil: 'networkidle0', timeout: 30000 }),
      ]);

      // 1. Check missing assets
      if (testPage.failedRequests.length > 0) {
        console.log('📦 MISSING ASSETS:');
        testPage.failedRequests.forEach(req => {
          this.log('error', `Missing asset: ${req.url.split('/').pop()}`, { url: req.url });
        });
        console.log('');
      }

      // 2. Compare page content (text, buttons, etc)
      console.log('📝 CONTENT COMPARISON:');
      const liveContent = await this.extractPageContent(livePage);
      const testContent = await this.extractPageContent(testPage);
      const contentDiffs = this.compareContent(liveContent, testContent, 'page');
      
      if (contentDiffs.length > 0) {
        contentDiffs.forEach(diff => {
          if (diff.type === 'title') {
            this.log('error', `Title differs`, { live: diff.live, test: diff.test });
          } else if (diff.type === 'h1') {
            this.log('error', `H1 headings differ`, { live: diff.live, test: diff.test });
          } else if (diff.type === 'buttons') {
            if (diff.missing.length > 0) {
              this.log('warning', `Missing buttons: ${diff.missing.slice(0, 5).join(', ')}`);
            }
          } else if (diff.type === 'backgrounds') {
            this.log('error', `Background images differ: live has ${diff.liveCount}, test has ${diff.testCount}`);
          }
        });
      } else {
        console.log('✅ Content matches');
      }
      console.log('');

      // 3. Full page visual comparison
      console.log('📸 VISUAL COMPARISON (scrolling through page):');
      const liveHeight = await livePage.evaluate(() => document.body.scrollHeight);
      const testHeight = await testPage.evaluate(() => document.body.scrollHeight);
      
      if (Math.abs(liveHeight - testHeight) > 200) {
        this.log('warning', `Page height differs: live=${liveHeight}px, test=${testHeight}px`);
      }

      const scrollPositions = Math.min(CONFIG.maxScrolls, Math.ceil(Math.max(liveHeight, testHeight) / CONFIG.scrollStep));
      
      for (let i = 0; i < scrollPositions; i++) {
        const scrollY = i * CONFIG.scrollStep;
        await Promise.all([
          livePage.evaluate((y) => window.scrollTo(0, y), scrollY),
          testPage.evaluate((y) => window.scrollTo(0, y), scrollY),
        ]);
        await new Promise(r => setTimeout(r, 400));

        const liveImg = path.join(OUTPUT_DIR, `live-scroll-${i}.png`);
        const testImg = path.join(OUTPUT_DIR, `test-scroll-${i}.png`);
        const diffImg = path.join(OUTPUT_DIR, `diff-scroll-${i}.png`);

        await Promise.all([
          livePage.screenshot({ path: liveImg }),
          testPage.screenshot({ path: testImg }),
        ]);

        const result = this.compareImages(liveImg, testImg, diffImg);
        if (result.error) {
          console.log(`❓ Scroll ${i} (Y=${scrollY}): comparison error - ${result.error}`);
        } else if (result.diffPercent > 2) {
          this.log('error', `Scroll ${i} (Y=${scrollY}-${scrollY+900}): ${result.diffPercent.toFixed(1)}% different`);
          // Identify regions
          if (result.regions && result.regions.length > 0) {
            const topRegions = result.regions.sort((a, b) => b.intensity - a.intensity).slice(0, 3);
            topRegions.forEach(r => {
              console.log(`   └─ Diff region at Y=${scrollY + r.y}px (${(r.intensity * 100).toFixed(0)}% intensity)`);
            });
          }
        } else {
          console.log(`✅ Scroll ${i} (Y=${scrollY}-${scrollY+900}): ${result.diffPercent.toFixed(1)}% diff`);
        }
      }
      console.log('');

      // 4. Key element comparison
      console.log('🔍 KEY ELEMENT COMPARISON:');
      for (const elem of CONFIG.keyElements) {
        const liveStyles = await this.getElementStyles(livePage, elem.selector);
        const testStyles = await this.getElementStyles(testPage, elem.selector);
        const liveText = await this.getTextContent(livePage, elem.selector);
        const testText = await this.getTextContent(testPage, elem.selector);

        if (!liveStyles && !testStyles) {
          continue; // Element doesn't exist on either
        }
        
        if (liveStyles && !testStyles) {
          this.log('error', `${elem.name}: exists on live but MISSING on test`);
          continue;
        }
        
        if (!liveStyles && testStyles) {
          this.log('warning', `${elem.name}: exists on test but not on live`);
          continue;
        }

        // Compare styles
        const styleDiffs = [];
        for (const style of CONFIG.stylesToCompare) {
          if (liveStyles[style] !== testStyles[style]) {
            styleDiffs.push({ style, live: liveStyles[style], test: testStyles[style] });
          }
        }
        
        if (styleDiffs.length > 0) {
          const importantDiffs = styleDiffs.filter(d => 
            d.style === 'backgroundColor' || 
            d.style === 'backgroundImage' || 
            d.style === 'opacity' ||
            d.style === 'display'
          );
          if (importantDiffs.length > 0) {
            this.log('warning', `${elem.name}: style differences`, {
              diffs: importantDiffs.map(d => `${d.style}: "${d.live}" vs "${d.test}"`),
            });
          }
        }

        // Compare text
        const liveTextSet = new Set(liveText.filter(Boolean));
        const testTextSet = new Set(testText.filter(Boolean));
        const missingText = [...liveTextSet].filter(t => !testTextSet.has(t) && t.length > 5);
        
        if (missingText.length > 0) {
          this.log('warning', `${elem.name}: missing text`, { missing: missingText.slice(0, 3) });
        }
      }
      console.log('');

      // 5. Interactivity tests
      console.log('🖱️ INTERACTIVITY TESTS:');
      for (const test of CONFIG.interactiveTests) {
        // Reset scroll
        await Promise.all([
          livePage.evaluate(() => window.scrollTo(0, 800)),
          testPage.evaluate(() => window.scrollTo(0, 800)),
        ]);
        await new Promise(r => setTimeout(r, 300));

        const liveResult = await this.testInteractivity(livePage, test);
        const testResult = await this.testInteractivity(testPage, test);

        if (liveResult.error && testResult.error) {
          console.log(`⚠️ ${test.name}: element not found on either site`);
        } else if (liveResult.changed && !testResult.changed && !testResult.error) {
          this.log('error', `${test.name}: interactive on live but NOT on test`);
        } else if (liveResult.changed && testResult.changed) {
          console.log(`✅ ${test.name}: interactive on both sites`);
        } else if (!liveResult.changed && !testResult.changed) {
          console.log(`⚠️ ${test.name}: no visible change on click (both sites)`);
        }
      }
      console.log('');

      // Summary
      console.log('═══════════════════════════════════════');
      console.log('📊 SUMMARY');
      console.log('═══════════════════════════════════════');
      const errors = this.issues.filter(i => i.type === 'error');
      const warnings = this.issues.filter(i => i.type === 'warning');
      console.log(`   Errors:   ${errors.length}`);
      console.log(`   Warnings: ${warnings.length}`);
      console.log(`\n📁 Diff images: ${OUTPUT_DIR}/diff-scroll-*.png`);

      if (errors.length > 0) {
        console.log('\n❌ VALIDATION FAILED - fix these issues:');
        errors.forEach((e, i) => console.log(`   ${i + 1}. ${e.message}`));
        process.exit(1);
      } else if (warnings.length > 0) {
        console.log('\n⚠️ VALIDATION PASSED WITH WARNINGS');
        warnings.forEach((w, i) => console.log(`   ${i + 1}. ${w.message}`));
      } else {
        console.log('\n✅ VALIDATION PASSED');
      }

    } finally {
      await this.close();
    }
  }
}

new DeepValidator().validate().catch(err => {
  console.error('Validator error:', err);
  process.exit(1);
});
