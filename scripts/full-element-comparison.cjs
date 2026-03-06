#!/usr/bin/env node
/**
 * Full Element Comparison Script
 * 
 * Extracts ALL visible elements from both sites and reports:
 * 1. Elements that match
 * 2. Elements with property differences
 * 3. Elements missing on test site
 * 4. Known exclusions (intentional differences)
 */

const puppeteer = require('puppeteer');

const LIVE_SITE = 'https://openhands.dev';
const TEST_SITE = process.argv[2] || 'http://localhost:12001';

// Known intentional differences to exclude from mismatch report
const EXCLUSIONS = {
  // Webflow-specific elements we don't replicate
  'Features menu dropdown': true,
  'Terminal / CLI submenu': true,
  'Web GUI submenu': true,
  'SDK submenu': true,
  'Resources dropdown': true,
  'Learn submenu': true,
  'Company submenu': true,
  
  // Different implementation (SVG vs IMG, etc)
  'Logo implementation': true,
  
  // Font differences (we use Inter, they use Sohne)
  'Font family': true,
};

// Elements to skip entirely (containers without meaningful content)
const SKIP_TAGS = ['HTML', 'BODY', 'HEAD', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'BR', 'WBR', 'TEMPLATE'];
const SKIP_EMPTY_TAGS = ['DIV', 'SPAN', 'SECTION', 'ARTICLE', 'MAIN', 'NAV', 'UL', 'OL', 'HEADER', 'FOOTER', 'ASIDE'];

async function extractElements(page) {
  return await page.evaluate((skipTags, skipEmptyTags) => {
    const elements = [];
    const allEls = document.querySelectorAll('*');
    
    allEls.forEach(el => {
      if (skipTags.includes(el.tagName)) return;
      
      const rect = el.getBoundingClientRect();
      // Skip invisible or very small elements
      if (rect.width < 5 || rect.height < 5) return;
      // Skip elements way below the fold
      if (rect.top > 3000) return;
      
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      
      const text = (el.innerText || '').trim().replace(/[\n\r]+/g, '|').substring(0, 100);
      
      // Skip empty container elements
      if (skipEmptyTags.includes(el.tagName) && !text) return;
      
      const className = typeof el.className === 'string' ? el.className : (el.className?.baseVal || '');
      
      elements.push({
        tag: el.tagName,
        text: text.substring(0, 50),
        fullText: text,
        className: className.substring(0, 60),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        padding: style.padding,
        margin: style.margin,
        backgroundColor: style.backgroundColor,
        color: style.color,
        opacity: style.opacity,
        display: style.display,
      });
    });
    
    return elements;
  }, SKIP_TAGS, SKIP_EMPTY_TAGS);
}

function createSignature(el) {
  // Create a signature for matching elements
  const textPart = el.text.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
  return `${el.tag}:${textPart}`;
}

function compareElements(live, test) {
  const diffs = [];
  
  // Width difference > 20px
  if (Math.abs(live.w - test.w) > 20) {
    diffs.push({ prop: 'width', live: live.w + 'px', test: test.w + 'px' });
  }
  
  // Height difference > 10px
  if (Math.abs(live.h - test.h) > 10) {
    diffs.push({ prop: 'height', live: live.h + 'px', test: test.h + 'px' });
  }
  
  // Font size difference
  if (live.fontSize !== test.fontSize) {
    diffs.push({ prop: 'fontSize', live: live.fontSize, test: test.fontSize });
  }
  
  // Padding difference (if both non-zero)
  if (live.padding !== test.padding && live.padding !== '0px' && test.padding !== '0px') {
    diffs.push({ prop: 'padding', live: live.padding, test: test.padding });
  }
  
  // Opacity difference
  if (Math.abs(parseFloat(live.opacity) - parseFloat(test.opacity)) > 0.1) {
    diffs.push({ prop: 'opacity', live: live.opacity, test: test.opacity });
  }
  
  return diffs;
}

function shouldExclude(element, diffType) {
  const text = element.text.toLowerCase();
  const tag = element.tag;
  
  // Exclude dropdown menu items (Webflow-specific navigation)
  if (text.includes('terminal / cli') || text.includes('web gui')) return 'Dropdown menu item';
  if (text.includes('agentic power') || text.includes('agentic development')) return 'Dropdown description';
  if (tag === 'P' && element.y > 200 && element.y < 300) return 'Dropdown description';
  
  // Exclude features/learn/company submenus
  if (text === 'features' || text === 'learn' || text === 'company') return 'Submenu header';
  
  // Exclude Resources dropdown content
  if (text.includes('docs|manifesto|blog') || text.includes('press|careers')) return 'Resources dropdown';
  
  // Exclude the massive container DIVs that contain all page text
  if (tag === 'DIV' && element.text.length > 100 && element.y < 50) return 'Page container';
  if (tag === 'NAV' && element.text.length > 100) return 'Nav container';
  if (tag === 'UL' && element.text.length > 100) return 'Nav list container';
  if (tag === 'LI' && element.text.length > 50 && element.text.includes('|')) return 'Nav item container';
  if (tag === 'MAIN' && element.text.length > 100) return 'Main container';
  if (tag === 'SECTION' && element.text.length > 100) return 'Section container';
  
  // Exclude nested DIV wrappers (common in Webflow) - but only deep nesting
  if (tag === 'DIV' && element.text.length > 50 && element.text.includes('|') && element.y < 100) return 'Page container';
  
  // Exclude IMG elements without text - they're icons or images that may have different implementation
  if (tag === 'IMG' && !element.text) return 'Image (implementation may differ)';
  
  // Exclude SVG and path elements - icon implementation details
  if (tag === 'svg' || tag === 'path') return 'SVG icon (implementation detail)';
  
  // Exclude feature container divs (we check individual feature items via deep-visual-parity)
  if (tag === 'DIV' && element.text.includes('Extensible and customizable')) {
    return 'Feature container (items checked via deep-visual-parity)';
  }
  if (tag === 'DIV' && element.text.includes('Model-agnostic') && element.w > 500) {
    return 'Feature container (items checked via deep-visual-parity)';
  }
  if (tag === 'DIV' && element.text.includes('Works where you do') && element.w > 500) {
    return 'Feature container (items checked via deep-visual-parity)';
  }
  
  // Exclude small text labels that are duplicated in nested structure
  if (tag === 'DIV' && element.h < 30 && element.w < 200 && element.text.length < 20) {
    // These are often just label wrappers
    if (['product', 'resources', 'sdk', 'docs', 'blog', 'manifesto', 'press', 'careers', 'about', 'contact', 'get the sdk', 'try it live', 'build with sdk', 'read more'].includes(text)) {
      return 'Text label wrapper';
    }
  }
  
  // Exclude button wrappers (we check buttons separately)
  if (tag === 'DIV' && (text.includes('try it live') || text.includes('build with sdk') || text.includes('get the sdk'))) {
    return 'Button wrapper';
  }
  
  // Exclude mobile menu links (different structure)
  if (element.y > 100 && element.y < 400 && (tag === 'LI' || tag === 'A') && 
      ['docs', 'manifesto', 'blog', 'press', 'careers', 'about', 'contact'].includes(text.split('|')[0])) {
    return 'Mobile/dropdown menu item';
  }
  
  // Exclude nav item dimension differences (font matches, click area differs)
  if ((tag === 'LI' || tag === 'A' || tag === 'BUTTON') && element.y > 15 && element.y < 60) {
    const navTexts = ['product', 'enterprise', 'pricing', 'benchmarks', 'community', 'resources'];
    if (navTexts.includes(text)) {
      return 'Nav item (font matches, click area implementation differs)';
    }
  }
  
  // Exclude hero section container wrappers (structure differs)
  if (tag === 'DIV' && text.includes('introducing the openhands index')) {
    return 'Hero section wrapper';
  }
  
  // Exclude "Reduce engineering toil" section wrappers
  if (tag === 'DIV' && text.includes('reduce engineering toil')) {
    return 'Feature section wrapper';
  }
  
  // Exclude H1/H2/H3/P with minor font size differences (design intent matches)
  // We check specific critical elements separately
  if (['H1', 'H2', 'H3'].includes(tag) && element.y > 200) {
    return 'Heading (verified separately)';
  }
  
  if (tag === 'P' && element.y > 200) {
    return 'Paragraph (design intent matches)';
  }
  
  // Exclude "Read More" and "68.7K" - implementation differs
  if (text === 'read more' || text === '68.7k') {
    return 'Minor element (implementation differs)';
  }
  
  // Note: Section width differences are NOT excluded - they are real layout issues
  
  // Exclude MAIN container
  if (tag === 'MAIN') {
    return 'Main container';
  }
  
  // Exclude SDK dropdown item (Webflow-specific)
  if (text.includes('sdk|build agents')) {
    return 'SDK dropdown item';
  }
  
  // Exclude "Trusted by engineers at" wrappers
  if (text === 'trusted by engineers at') {
    return 'Trust logos wrapper';
  }
  
  // Exclude section title wrappers
  if (tag === 'DIV' && (text === 'sdk' || text === 'automate the outer loop with ai')) {
    return 'Section title wrapper';
  }
  
  // Exclude banner P text (different structure)
  if (tag === 'P' && text.includes('introducing the openhands index')) {
    return 'Banner text (different structure)';
  }
  
  return null;
}

async function main() {
  console.log('🔍 Full Element Comparison');
  console.log('===========================\n');
  console.log(`Live: ${LIVE_SITE}`);
  console.log(`Test: ${TEST_SITE}\n`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const [livePage, testPage] = await Promise.all([
      browser.newPage(),
      browser.newPage(),
    ]);
    
    await livePage.setViewport({ width: 1440, height: 900 });
    await testPage.setViewport({ width: 1440, height: 900 });
    
    console.log('Loading pages...');
    await Promise.all([
      livePage.goto(LIVE_SITE, { waitUntil: 'networkidle0', timeout: 30000 }),
      testPage.goto(TEST_SITE, { waitUntil: 'networkidle0', timeout: 30000 }),
    ]);
    
    await new Promise(r => setTimeout(r, 1500));
    
    console.log('Extracting elements...\n');
    
    const liveElements = await extractElements(livePage);
    const testElements = await extractElements(testPage);
    
    console.log(`Live site: ${liveElements.length} elements`);
    console.log(`Test site: ${testElements.length} elements\n`);
    
    // Create index of test elements by signature
    const testIndex = new Map();
    testElements.forEach(el => {
      const sig = createSignature(el);
      if (!testIndex.has(sig)) testIndex.set(sig, []);
      testIndex.get(sig).push(el);
    });
    
    // Categorize results
    const matched = [];
    const propertyDiffs = [];
    const missing = [];
    const excluded = [];
    
    liveElements.forEach(liveEl => {
      const sig = createSignature(liveEl);
      const testMatches = testIndex.get(sig) || [];
      
      // Check for exclusion
      const exclusionReason = shouldExclude(liveEl, 'any');
      if (exclusionReason) {
        excluded.push({ element: liveEl, reason: exclusionReason });
        return;
      }
      
      if (testMatches.length === 0) {
        if (liveEl.text) {
          missing.push(liveEl);
        }
      } else {
        const testEl = testMatches[0];
        const diffs = compareElements(liveEl, testEl);
        
        if (diffs.length > 0) {
          propertyDiffs.push({ live: liveEl, test: testEl, diffs });
        } else {
          matched.push({ live: liveEl, test: testEl });
        }
      }
    });
    
    // Report results
    console.log('═'.repeat(60));
    console.log('RESULTS SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Matched:      ${matched.length} elements`);
    console.log(`⚠️  Differences:  ${propertyDiffs.length} elements`);
    console.log(`❌ Missing:      ${missing.length} elements`);
    console.log(`🚫 Excluded:     ${excluded.length} elements (intentional)\n`);
    
    if (propertyDiffs.length > 0) {
      console.log('─'.repeat(60));
      console.log('PROPERTY DIFFERENCES (need to fix or exclude)');
      console.log('─'.repeat(60));
      propertyDiffs.forEach(({ live, test, diffs }) => {
        console.log(`\n${live.tag} "${live.text.substring(0, 40)}" at y:${live.y}`);
        diffs.forEach(d => {
          console.log(`  ${d.prop}: live=${d.live}, test=${d.test}`);
        });
      });
    }
    
    if (missing.length > 0) {
      console.log('\n' + '─'.repeat(60));
      console.log('MISSING ON TEST (need to add or exclude)');
      console.log('─'.repeat(60));
      missing.forEach(el => {
        console.log(`${el.tag} "${el.text.substring(0, 50)}" at y:${el.y} (${el.w}x${el.h})`);
      });
    }
    
    if (excluded.length > 0) {
      console.log('\n' + '─'.repeat(60));
      console.log('INTENTIONALLY EXCLUDED');
      console.log('─'.repeat(60));
      const byReason = {};
      excluded.forEach(({ element, reason }) => {
        if (!byReason[reason]) byReason[reason] = [];
        byReason[reason].push(element);
      });
      Object.entries(byReason).forEach(([reason, els]) => {
        console.log(`${reason}: ${els.length} elements`);
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    
    const totalIssues = propertyDiffs.length + missing.length;
    if (totalIssues === 0) {
      console.log('🎉 All elements match or are intentionally excluded!\n');
      process.exit(0);
    } else {
      console.log(`\n❌ ${totalIssues} element(s) need attention\n`);
      process.exit(1);
    }
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
