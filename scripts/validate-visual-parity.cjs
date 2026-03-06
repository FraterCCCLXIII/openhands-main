#!/usr/bin/env node
/**
 * Visual Parity Validation Script
 * 
 * Compares computed styles between the live Webflow site (openhands.dev) 
 * and our React implementation to catch styling differences.
 * 
 * Key elements compared:
 * - Logo (size)
 * - Header navigation buttons (padding, border-radius, whitespace)
 * - Banner (border-radius, background-color)
 * - H1 heading (font-size, font-weight, line-height, letter-spacing)
 * - CTA buttons (padding, border-radius)
 * - ASCII background (presence)
 */

const puppeteer = require('puppeteer');

const LIVE_SITE = 'https://openhands.dev';
const TEST_SITE = process.argv[2] || 'http://localhost:12001';

// Elements to compare with their semantic selectors
const ELEMENTS_TO_COMPARE = [
  {
    name: 'Logo Container',
    liveSelector: '.nav_logo_link',
    testSelector: 'header a[href="/"]', // Link containing logo
    styles: ['width', 'height'],
  },
  {
    name: 'Header - Build with SDK Button',
    liveSelector: '.nav_right .button:first-of-type',
    testSelector: 'header a[href*="docs.openhands.dev/sdk"]',
    styles: ['padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRadius', 'fontSize', 'fontWeight', 'whiteSpace'],
  },
  {
    name: 'Header - Try it live Button',
    liveSelector: '.nav_right .button:last-of-type',
    testSelector: 'header a[href*="app.all-hands.dev"]',
    styles: ['padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRadius', 'fontSize', 'fontWeight', 'backgroundColor'],
  },
  {
    name: 'Banner',
    liveSelector: '.banner',
    testSelector: '[class*="bg-brand-accent"]', // Banner with accent background
    styles: ['borderRadius', 'backgroundColor', 'padding'],
  },
  {
    name: 'Hero H1',
    liveSelector: '.h1, h1',
    testSelector: 'h1',
    styles: ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'],
  },
  {
    name: 'Hero Subtitle',
    liveSelector: '.paragraph-lg',
    testSelector: 'section p', // First paragraph in hero
    styles: ['fontSize', 'fontWeight', 'lineHeight'],
  },
  {
    name: 'Hero CTA - Try it live',
    liveSelector: '.hero_btn_wrap .button:first-of-type',
    testSelector: 'section .btn-primary',
    styles: ['padding', 'borderRadius', 'fontSize', 'fontWeight'],
  },
];

// Check for presence of key features
const FEATURES_TO_CHECK = [
  {
    name: 'ASCII Animation Background',
    liveSelector: '.ascii-pre, .asci-wrap',
    testSelector: '.ascii-pre, [class*="ascii"]',
  },
  {
    name: 'Backdrop Blur on Header',
    selector: 'header, .nav_wrap',
    checkStyle: 'backdropFilter',
    expectedContains: 'blur',
  },
];

async function getComputedStyles(page, selector, styles) {
  try {
    return await page.evaluate((sel, styleProps) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      
      const computed = window.getComputedStyle(el);
      const result = {};
      
      for (const prop of styleProps) {
        result[prop] = computed[prop];
      }
      
      // Also get bounding box
      const rect = el.getBoundingClientRect();
      result._width = rect.width;
      result._height = rect.height;
      
      return result;
    }, selector, styles);
  } catch (e) {
    return null;
  }
}

async function checkElementExists(page, selector) {
  try {
    return await page.evaluate((sel) => {
      return document.querySelector(sel) !== null;
    }, selector);
  } catch (e) {
    return false;
  }
}

function compareStyles(liveSty, testSty, tolerance = {}) {
  const differences = [];
  
  if (!liveSty || !testSty) {
    return [{ property: 'element', issue: 'Element not found on one or both sites' }];
  }
  
  for (const [prop, liveVal] of Object.entries(liveSty)) {
    if (prop.startsWith('_')) continue; // Skip internal props
    
    const testVal = testSty[prop];
    
    if (liveVal !== testVal) {
      // Check if it's a numeric difference within tolerance
      const liveNum = parseFloat(liveVal);
      const testNum = parseFloat(testVal);
      
      if (!isNaN(liveNum) && !isNaN(testNum)) {
        const diff = Math.abs(liveNum - testNum);
        const toleranceVal = tolerance[prop] || 2; // 2px default tolerance
        
        if (diff <= toleranceVal) {
          continue; // Within tolerance
        }
      }
      
      differences.push({
        property: prop,
        live: liveVal,
        test: testVal,
      });
    }
  }
  
  return differences;
}

function formatDifference(diff) {
  return `  ${diff.property}: live="${diff.live}" vs test="${diff.test}"`;
}

async function main() {
  console.log('🔍 Visual Parity Validation Script');
  console.log('==================================\n');
  console.log(`Live site: ${LIVE_SITE}`);
  console.log(`Test site: ${TEST_SITE}\n`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  let totalIssues = 0;
  
  try {
    // Load both pages
    const [livePage, testPage] = await Promise.all([
      browser.newPage(),
      browser.newPage(),
    ]);
    
    // Set viewport to desktop
    await livePage.setViewport({ width: 1440, height: 900 });
    await testPage.setViewport({ width: 1440, height: 900 });
    
    console.log('Loading pages...');
    await Promise.all([
      livePage.goto(LIVE_SITE, { waitUntil: 'networkidle0', timeout: 30000 }),
      testPage.goto(TEST_SITE, { waitUntil: 'networkidle0', timeout: 30000 }),
    ]);
    
    console.log('Pages loaded. Comparing styles...\n');
    
    // Compare elements
    console.log('📊 Element Style Comparison');
    console.log('---------------------------');
    
    for (const element of ELEMENTS_TO_COMPARE) {
      const liveStyles = await getComputedStyles(livePage, element.liveSelector, element.styles);
      const testStyles = await getComputedStyles(testPage, element.testSelector, element.styles);
      
      const differences = compareStyles(liveStyles, testStyles);
      
      if (differences.length === 0) {
        console.log(`✅ ${element.name}: MATCH`);
      } else {
        console.log(`❌ ${element.name}: MISMATCH`);
        differences.forEach(diff => {
          console.log(formatDifference(diff));
        });
        totalIssues += differences.length;
      }
    }
    
    console.log('\n📋 Feature Presence Check');
    console.log('-------------------------');
    
    for (const feature of FEATURES_TO_CHECK) {
      if (feature.liveSelector && feature.testSelector) {
        const liveHas = await checkElementExists(livePage, feature.liveSelector);
        const testHas = await checkElementExists(testPage, feature.testSelector);
        
        if (liveHas && testHas) {
          console.log(`✅ ${feature.name}: Present on both sites`);
        } else if (liveHas && !testHas) {
          console.log(`❌ ${feature.name}: Missing on test site (present on live)`);
          totalIssues++;
        } else if (!liveHas && testHas) {
          console.log(`⚠️  ${feature.name}: Present on test but not live (unexpected)`);
        } else {
          console.log(`⚠️  ${feature.name}: Missing on both sites`);
        }
      }
    }
    
    // Summary
    console.log('\n==================================');
    if (totalIssues === 0) {
      console.log('✅ All checks passed!');
    } else {
      console.log(`❌ Found ${totalIssues} issue(s) to fix`);
    }
    
  } catch (error) {
    console.error('Error during validation:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
  
  process.exit(totalIssues > 0 ? 1 : 0);
}

main();
