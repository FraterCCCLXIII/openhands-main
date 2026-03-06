#!/usr/bin/env node
/**
 * Deep Visual Parity Validation Script
 * 
 * Compares VISUAL APPEARANCE between live Webflow site and React implementation.
 * Focuses on what users SEE, not internal HTML structure differences.
 * 
 * What we CHECK (real visual issues):
 * - Header buttons on single line (not wrapping)
 * - GitHub stars format (68.7K)
 * - ASCII background presence and font-size
 * - Key visual elements are present
 * 
 * What we IGNORE (expected differences):
 * - HTML structure (Webflow has nested divs, we don't)
 * - Element counts (Webflow duplicates text for accessibility)
 * - Font family (we use Inter, they use proprietary Sohne)
 * - Exact text content in some places (intentionally different)
 * - ASCII random characters (generated dynamically)
 * - Width differences due to different text content
 */

const puppeteer = require('puppeteer');

const LIVE_SITE = 'https://openhands.dev';
const TEST_SITE = process.argv[2] || 'http://localhost:12001';

/**
 * Parse color string to get RGBA components
 */
function parseColor(colorStr) {
  if (!colorStr) return null;
  // Handle rgb(r, g, b) and rgba(r, g, b, a)
  const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  return null;
}

/**
 * Compare two colors for similarity
 */
function colorsMatch(color1, color2, tolerance = 10) {
  if (!color1 || !color2) return false;
  return Math.abs(color1.r - color2.r) <= tolerance &&
         Math.abs(color1.g - color2.g) <= tolerance &&
         Math.abs(color1.b - color2.b) <= tolerance;
}

/**
 * Check if alpha/opacity values match
 */
function opacityMatches(alpha1, alpha2, tolerance = 0.1) {
  return Math.abs(alpha1 - alpha2) <= tolerance;
}

/**
 * Run all visual parity checks
 */
async function runChecks(livePage, testPage) {
  const issues = [];
  
  // ===========================================
  // CATEGORY: OPACITY/TRANSPARENCY
  // ===========================================
  
  // Check banner background opacity
  const bannerOpacityCheck = await Promise.all([
    livePage.evaluate(() => {
      const el = document.querySelector('.banner');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        opacity: computed.opacity,
      };
    }),
    testPage.evaluate(() => {
      const el = document.querySelector('[class*="bg-brand-accent"]');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        opacity: computed.opacity,
      };
    }),
  ]);
  
  const [liveBanner, testBanner] = bannerOpacityCheck;
  if (liveBanner && testBanner) {
    const liveColor = parseColor(liveBanner.backgroundColor);
    const testColor = parseColor(testBanner.backgroundColor);
    
    if (liveColor && testColor) {
      // Check if alpha values differ significantly
      if (!opacityMatches(liveColor.a, testColor.a, 0.05)) {
        issues.push({
          check: 'Banner Background Opacity',
          status: 'FAIL',
          message: `Banner opacity differs: live alpha=${liveColor.a.toFixed(2)}, test alpha=${testColor.a.toFixed(2)}`,
          liveValue: liveBanner.backgroundColor,
          testValue: testBanner.backgroundColor,
        });
      }
    }
  }
  
  // ===========================================
  // CATEGORY: COLOR MATCHING
  // ===========================================
  
  // Check ASCII background color
  const asciiColorCheck = await Promise.all([
    livePage.evaluate(() => {
      const el = document.querySelector('.asci-wrap pre, .ascii-text');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        opacity: computed.opacity,
      };
    }),
    testPage.evaluate(() => {
      const el = document.querySelector('.ascii-pre, pre');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        opacity: computed.opacity,
      };
    }),
  ]);
  
  const [liveAscii, testAscii] = asciiColorCheck;
  if (liveAscii && testAscii) {
    const liveColor = parseColor(liveAscii.color);
    const testColor = parseColor(testAscii.color);
    
    if (liveColor && testColor && !colorsMatch(liveColor, testColor, 30)) {
      issues.push({
        check: 'ASCII Text Color',
        status: 'FAIL',
        message: `ASCII text color differs significantly`,
        liveValue: liveAscii.color,
        testValue: testAscii.color,
      });
    }
  }
  
  // ===========================================
  // CATEGORY: FONT SIZE COMPARISON
  // ===========================================
  
  // Compare ASCII font sizes between sites
  const asciiFontCheck = await Promise.all([
    livePage.evaluate(() => {
      const el = document.querySelector('.asci-wrap pre, .ascii-text');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
      };
    }),
    testPage.evaluate(() => {
      const el = document.querySelector('.ascii-pre, pre');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
      };
    }),
  ]);
  
  const [liveAsciiFont, testAsciiFont] = asciiFontCheck;
  if (liveAsciiFont && testAsciiFont) {
    const liveFontSize = parseFloat(liveAsciiFont.fontSize);
    const testFontSize = parseFloat(testAsciiFont.fontSize);
    
    // Font sizes should match within 2px
    if (Math.abs(liveFontSize - testFontSize) > 2) {
      issues.push({
        check: 'ASCII Font Size Match',
        status: 'FAIL',
        message: `ASCII font-size differs from live site: live=${liveFontSize}px, test=${testFontSize}px`,
        liveValue: liveAsciiFont.fontSize,
        testValue: testAsciiFont.fontSize,
      });
    }
  }
  
  // ===========================================
  // CATEGORY: ELEMENT OPACITY
  // ===========================================
  
  // Check ASCII PRE element opacity (the text itself, not container)
  const asciiOpacityCheck = await Promise.all([
    livePage.evaluate(() => {
      const el = document.querySelector('.asci-wrap pre');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return parseFloat(computed.opacity);
    }),
    testPage.evaluate(() => {
      const el = document.querySelector('.ascii-pre, pre');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return parseFloat(computed.opacity);
    }),
  ]);
  
  const [liveAsciiOpacity, testAsciiOpacity] = asciiOpacityCheck;
  if (liveAsciiOpacity !== null && testAsciiOpacity !== null) {
    if (!opacityMatches(liveAsciiOpacity, testAsciiOpacity, 0.05)) {
      issues.push({
        check: 'ASCII Text Opacity',
        status: 'FAIL',
        message: `ASCII text opacity differs: live=${liveAsciiOpacity.toFixed(2)}, test=${testAsciiOpacity.toFixed(2)}`,
        liveValue: liveAsciiOpacity,
        testValue: testAsciiOpacity,
      });
    }
  }
  
  // ===========================================
  // CATEGORY: ELEMENT DIMENSIONS
  // ===========================================
  
  // CHECK: Header dimensions and padding should match live site
  const headerDimensionsCheck = await Promise.all([
    livePage.evaluate(() => {
      const header = document.querySelector('nav.nav_wrap, nav, header');
      if (!header) return null;
      const rect = header.getBoundingClientRect();
      const style = window.getComputedStyle(header);
      // Get inner container width
      const inner = header.querySelector('div');
      const innerRect = inner ? inner.getBoundingClientRect() : null;
      return {
        height: rect.height,
        padding: style.padding,
        paddingTop: parseFloat(style.paddingTop),
        paddingLeft: parseFloat(style.paddingLeft),
        innerWidth: innerRect?.width,
      };
    }),
    testPage.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return null;
      const rect = header.getBoundingClientRect();
      const style = window.getComputedStyle(header);
      const inner = header.querySelector('div');
      const innerRect = inner ? inner.getBoundingClientRect() : null;
      return {
        height: rect.height,
        padding: style.padding,
        paddingTop: parseFloat(style.paddingTop),
        paddingLeft: parseFloat(style.paddingLeft),
        innerWidth: innerRect?.width,
      };
    }),
  ]);
  
  const [liveHeader, testHeader] = headerDimensionsCheck;
  if (liveHeader && testHeader) {
    // Height should match within 5px
    if (Math.abs(liveHeader.height - testHeader.height) > 5) {
      issues.push({
        check: 'Header Height',
        status: 'FAIL',
        message: `Header height differs: live=${liveHeader.height.toFixed(0)}px, test=${testHeader.height.toFixed(0)}px`,
      });
    }
    // Padding should match
    if (Math.abs(liveHeader.paddingTop - testHeader.paddingTop) > 2) {
      issues.push({
        check: 'Header Padding',
        status: 'FAIL',
        message: `Header padding differs: live="${liveHeader.padding}", test="${testHeader.padding}"`,
      });
    }
    // Inner container width should match within 50px
    if (liveHeader.innerWidth && testHeader.innerWidth && 
        Math.abs(liveHeader.innerWidth - testHeader.innerWidth) > 50) {
      issues.push({
        check: 'Header Inner Width',
        status: 'FAIL',
        message: `Header inner width differs: live=${liveHeader.innerWidth.toFixed(0)}px, test=${testHeader.innerWidth.toFixed(0)}px`,
      });
    }
  }
  
  // CHECK: Logo container dimensions should match live site
  // Note: Live uses img, test uses SVG, so we check the container (a[href="/"])
  const logoDimensionsCheck = await Promise.all([
    livePage.evaluate(() => {
      // Live site logo container
      const logoContainer = document.querySelector('a[href="/"]');
      const logo = document.querySelector('a[href="/"] img');
      if (!logoContainer) return null;
      const containerRect = logoContainer.getBoundingClientRect();
      const logoRect = logo ? logo.getBoundingClientRect() : null;
      return {
        containerWidth: containerRect.width,
        containerHeight: containerRect.height,
        logoWidth: logoRect?.width,
        logoHeight: logoRect?.height,
      };
    }),
    testPage.evaluate(() => {
      // Test site logo container (uses SVG, not img)
      const logoContainer = document.querySelector('header a[href="/"]');
      if (!logoContainer) return null;
      const containerRect = logoContainer.getBoundingClientRect();
      // Get the SVG inside
      const svg = logoContainer.querySelector('svg');
      const svgRect = svg ? svg.getBoundingClientRect() : null;
      return {
        containerWidth: containerRect.width,
        containerHeight: containerRect.height,
        logoWidth: svgRect?.width,
        logoHeight: svgRect?.height,
      };
    }),
  ]);
  
  const [liveLogo, testLogo] = logoDimensionsCheck;
  if (liveLogo && testLogo) {
    // Logo container width should match within 10px
    if (Math.abs(liveLogo.containerWidth - testLogo.containerWidth) > 10) {
      issues.push({
        check: 'Logo Width',
        status: 'FAIL',
        message: `Logo container width differs: live=${liveLogo.containerWidth.toFixed(0)}px, test=${testLogo.containerWidth.toFixed(0)}px`,
      });
    }
    // Logo height should match within 5px
    if (liveLogo.logoHeight && testLogo.logoHeight && 
        Math.abs(liveLogo.logoHeight - testLogo.logoHeight) > 5) {
      issues.push({
        check: 'Logo Height',
        status: 'FAIL',
        message: `Logo height differs: live=${liveLogo.logoHeight.toFixed(0)}px, test=${testLogo.logoHeight.toFixed(0)}px`,
      });
    }
  }
  
  // CHECK: Feature item widths should match live site (2-column ~600px each)
  const featureWidthCheck = await Promise.all([
    livePage.evaluate(() => {
      const sections = document.querySelectorAll('section');
      for (const s of sections) {
        if (s.innerText.includes('Why teams choose')) {
          const items = s.querySelectorAll('[class*="feature"], [class*="item"]');
          if (items.length > 0) {
            const rect = items[0].getBoundingClientRect();
            if (rect.width > 400 && rect.width < 700) return Math.round(rect.width);
          }
        }
      }
      return null;
    }),
    testPage.evaluate(() => {
      const sections = document.querySelectorAll('section');
      for (const s of sections) {
        if (s.innerText.includes('Why teams choose')) {
          const items = s.querySelectorAll('.feature-item');
          if (items.length > 0) {
            const rect = items[0].getBoundingClientRect();
            if (rect.width > 400 && rect.width < 700) return Math.round(rect.width);
          }
        }
      }
      return null;
    }),
  ]);
  
  const [liveFeatureWidth, testFeatureWidth] = featureWidthCheck;
  if (liveFeatureWidth && testFeatureWidth) {
    if (Math.abs(liveFeatureWidth - testFeatureWidth) > 50) {
      issues.push({
        check: 'Feature Item Width',
        status: 'FAIL',
        message: `Feature item width differs: live=${liveFeatureWidth}px, test=${testFeatureWidth}px`,
      });
    }
  }
  
  // CHECK: Section width should be full viewport (1440px at this viewport)
  const sectionWidthCheck = await Promise.all([
    livePage.evaluate(() => {
      const sections = document.querySelectorAll('section');
      const widths = [];
      sections.forEach(s => {
        const rect = s.getBoundingClientRect();
        if (rect.y > 100 && rect.y < 2000 && rect.width > 1000) {
          widths.push(rect.width);
        }
      });
      return widths.length > 0 ? Math.round(widths.reduce((a, b) => a + b, 0) / widths.length) : null;
    }),
    testPage.evaluate(() => {
      const sections = document.querySelectorAll('section');
      const widths = [];
      sections.forEach(s => {
        const rect = s.getBoundingClientRect();
        if (rect.y > 100 && rect.y < 2000 && rect.width > 1000) {
          widths.push(rect.width);
        }
      });
      return widths.length > 0 ? Math.round(widths.reduce((a, b) => a + b, 0) / widths.length) : null;
    }),
  ]);
  
  const [liveSectionWidth, testSectionWidth] = sectionWidthCheck;
  if (liveSectionWidth && testSectionWidth) {
    if (Math.abs(liveSectionWidth - testSectionWidth) > 50) {
      issues.push({
        check: 'Section Width',
        status: 'FAIL',
        message: `Section width differs: live=${liveSectionWidth}px, test=${testSectionWidth}px`,
      });
    }
  }
  
  // CHECK: Trust logo images width should match live site
  const trustLogoWidthCheck = await Promise.all([
    livePage.evaluate(() => {
      const logos = document.querySelectorAll('.logo-grid img, [class*="logo"] img');
      const widths = [];
      logos.forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.y > 500 && rect.y < 800 && rect.width > 20) {
          widths.push(rect.width);
        }
      });
      return widths.length > 0 ? Math.round(widths.reduce((a, b) => a + b, 0) / widths.length) : null;
    }),
    testPage.evaluate(() => {
      const logos = document.querySelectorAll('.logo-grid img, [class*="logo"] img, img');
      const widths = [];
      logos.forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.y > 500 && rect.y < 800 && rect.width > 20) {
          widths.push(rect.width);
        }
      });
      return widths.length > 0 ? Math.round(widths.reduce((a, b) => a + b, 0) / widths.length) : null;
    }),
  ]);
  
  const [liveTrustLogoWidth, testTrustLogoWidth] = trustLogoWidthCheck;
  if (liveTrustLogoWidth && testTrustLogoWidth) {
    if (Math.abs(liveTrustLogoWidth - testTrustLogoWidth) > 15) {
      issues.push({
        check: 'Trust Logo Width',
        status: 'FAIL',
        message: `Trust logo average width differs: live=${liveTrustLogoWidth}px, test=${testTrustLogoWidth}px`,
      });
    }
  }
  
  // CHECK: Trust logo opacity should match live site
  const trustLogoOpacityCheck = await Promise.all([
    livePage.evaluate(() => {
      const logo = document.querySelector('.logo-grid img, [class*="logo"] img');
      if (!logo) return null;
      return window.getComputedStyle(logo).opacity;
    }),
    testPage.evaluate(() => {
      const logos = document.querySelectorAll('img');
      for (const img of logos) {
        const rect = img.getBoundingClientRect();
        if (rect.y > 500 && rect.y < 800 && rect.width > 20) {
          return window.getComputedStyle(img).opacity;
        }
      }
      return null;
    }),
  ]);
  
  const [liveTrustOpacity, testTrustOpacity] = trustLogoOpacityCheck;
  if (liveTrustOpacity && testTrustOpacity) {
    if (Math.abs(parseFloat(liveTrustOpacity) - parseFloat(testTrustOpacity)) > 0.1) {
      issues.push({
        check: 'Trust Logo Opacity',
        status: 'FAIL',
        message: `Trust logo opacity differs: live=${liveTrustOpacity}, test=${testTrustOpacity}`,
      });
    }
  }
  
  // CHECK: Navigation link font size should match live site
  const navFontCheck = await Promise.all([
    livePage.evaluate(() => {
      const navLinks = document.querySelectorAll('nav a, .nav_menu a');
      const sizes = [];
      navLinks.forEach(link => {
        const style = window.getComputedStyle(link);
        const text = link.innerText?.trim();
        if (text && !text.includes('\n') && text.length < 20) {
          sizes.push({ text, fontSize: style.fontSize, height: link.getBoundingClientRect().height });
        }
      });
      return sizes.slice(0, 6); // First 6 nav items
    }),
    testPage.evaluate(() => {
      const navLinks = document.querySelectorAll('header nav a, header a');
      const sizes = [];
      navLinks.forEach(link => {
        const style = window.getComputedStyle(link);
        const text = link.innerText?.trim();
        if (text && !text.includes('\n') && text.length < 20) {
          sizes.push({ text, fontSize: style.fontSize, height: link.getBoundingClientRect().height });
        }
      });
      return sizes.slice(0, 6);
    }),
  ]);
  
  const [liveNavItems, testNavItems] = navFontCheck;
  if (liveNavItems.length > 0 && testNavItems.length > 0) {
    const liveSize = liveNavItems[0]?.fontSize;
    const testSize = testNavItems[0]?.fontSize;
    if (liveSize && testSize && liveSize !== testSize) {
      issues.push({
        check: 'Navigation Font Size',
        status: 'FAIL',
        message: `Nav link font-size differs: live=${liveSize}, test=${testSize}`,
      });
    }
  }
  
  // ===========================================
  // EXISTING CHECKS
  // ===========================================
  
  // CHECK: Header buttons should not wrap (be on single line)
  const headerButtonCheck = await testPage.evaluate(() => {
    const buttons = document.querySelectorAll('header .btn');
    const results = [];
    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const computed = window.getComputedStyle(btn);
      const fontSize = parseFloat(computed.fontSize) || 16;
      const lineHeight = parseFloat(computed.lineHeight) || fontSize * 1.3;
      const paddingTop = parseFloat(computed.paddingTop) || 0;
      const paddingBottom = parseFloat(computed.paddingBottom) || 0;
      
      const expectedSingleLineHeight = lineHeight + paddingTop + paddingBottom;
      const isWrapping = rect.height > expectedSingleLineHeight + 10;
      
      results.push({ 
        text: btn.innerText?.trim(), 
        height: rect.height,
        expectedHeight: expectedSingleLineHeight,
        isWrapping 
      });
    });
    return results;
  });
  
  const wrappingButtons = headerButtonCheck.filter(b => b.isWrapping);
  if (wrappingButtons.length > 0) {
    issues.push({
      check: 'Header Buttons Single Line',
      status: 'FAIL',
      message: `Header buttons are wrapping: ${wrappingButtons.map(b => `${b.text} (h=${b.height.toFixed(0)}px, expected=${b.expectedHeight.toFixed(0)}px)`).join(', ')}`,
      details: headerButtonCheck,
    });
  }
  
  // CHECK: GitHub stars format should match live site
  const githubStarsCheck = await Promise.all([
    livePage.evaluate(() => {
      const el = document.querySelector('a[href*="github.com/OpenHands"]');
      return el ? el.innerText?.trim() : null;
    }),
    testPage.evaluate(() => {
      const el = document.querySelector('header a[href*="github.com"]');
      return el ? el.innerText?.trim() : null;
    }),
  ]);
  
  const [liveStars, testStars] = githubStarsCheck;
  if (liveStars && testStars) {
    // Compare format pattern (e.g., both should be "XX.XK" format)
    // Extract the format pattern from live site
    const livePattern = liveStars.replace(/[\d.]+/, 'N'); // e.g., "68.7K" -> "NK"
    const testPattern = testStars.replace(/[\d.]+/, 'N');
    
    if (livePattern !== testPattern) {
      issues.push({
        check: 'GitHub Stars Format',
        status: 'FAIL',
        message: `GitHub stars format differs: live="${liveStars}" (pattern: ${livePattern}), test="${testStars}" (pattern: ${testPattern})`,
      });
    }
  } else if (liveStars && !testStars) {
    issues.push({
      check: 'GitHub Stars Format',
      status: 'FAIL',
      message: `GitHub stars missing on test site (live has: "${liveStars}")`,
    });
  }
  
  // CHECK: ASCII background presence should match live site
  const asciiPresenceCheck = await Promise.all([
    livePage.evaluate(() => {
      const el = document.querySelector('.asci-wrap, .ascii-background');
      return { exists: !!el };
    }),
    testPage.evaluate(() => {
      const el = document.querySelector('.ascii-pre, pre[class*="ascii"]');
      return { exists: !!el };
    }),
  ]);
  
  const [liveAsciiPresence, testAsciiPresence] = asciiPresenceCheck;
  if (liveAsciiPresence.exists && !testAsciiPresence.exists) {
    issues.push({
      check: 'ASCII Background Presence',
      status: 'FAIL',
      message: 'ASCII background exists on live but not on test',
    });
  }
  // Note: Font size and opacity are checked by other comparisons against live site
  
  // CHECK: Hero section elements should match live site structure
  const heroCheck = await Promise.all([
    livePage.evaluate(() => {
      return {
        hasH1: !!document.querySelector('.hero_title, section h1, .h1'),
        hasBanner: !!document.querySelector('.banner'),
        ctaButtonCount: document.querySelectorAll('.hero_btn_wrap .button, .hero a.button').length,
      };
    }),
    testPage.evaluate(() => {
      return {
        hasH1: !!document.querySelector('section h1'),
        hasBanner: !!document.querySelector('[class*="bg-brand-accent"]'),
        ctaButtonCount: document.querySelectorAll('section .btn').length,
      };
    }),
  ]);
  
  const [liveHero, testHero] = heroCheck;
  
  if (liveHero.hasH1 && !testHero.hasH1) {
    issues.push({ check: 'Hero H1', status: 'FAIL', message: 'Hero H1 exists on live but not on test' });
  }
  if (liveHero.hasBanner && !testHero.hasBanner) {
    issues.push({ check: 'Hero Banner', status: 'FAIL', message: 'Hero banner exists on live but not on test' });
  }
  if (liveHero.ctaButtonCount > 0 && testHero.ctaButtonCount < liveHero.ctaButtonCount) {
    issues.push({ 
      check: 'Hero CTA Buttons', 
      status: 'FAIL', 
      message: `Hero CTA buttons: live has ${liveHero.ctaButtonCount}, test has ${testHero.ctaButtonCount}` 
    });
  }
  
  // CHECK: Trust logos should match live site
  const trustLogosCheck = await Promise.all([
    livePage.evaluate(() => {
      // Get logo alt texts from live site
      const logos = document.querySelectorAll('.logo-grid img, .trust-logos img, [class*="logo"] img');
      return Array.from(logos)
        .map(img => img.alt?.trim())
        .filter(alt => alt && alt.length > 0);
    }),
    testPage.evaluate(() => {
      const logos = document.querySelectorAll('.logo-grid img, img[alt]');
      return Array.from(logos)
        .map(img => img.alt?.trim())
        .filter(alt => alt && alt.length > 0);
    }),
  ]);
  
  const [liveLogos, testLogos] = trustLogosCheck;
  const testLogoSet = new Set(testLogos.map(l => l.toLowerCase()));
  
  // Check if key logos from live are present on test
  const missingLogos = liveLogos.filter(logo => 
    !testLogoSet.has(logo.toLowerCase())
  );
  
  // Only fail if major logos are missing (filter to company names)
  const majorMissing = missingLogos.filter(logo => 
    ['tiktok', 'vmware', 'amazon', 'netflix', 'google', 'nvidia'].some(co => 
      logo.toLowerCase().includes(co)
    )
  );
  
  if (majorMissing.length > 0) {
    issues.push({
      check: 'Trust Logos Section',
      status: 'FAIL', 
      message: `Trust logos on live but missing from test: ${majorMissing.slice(0, 5).join(', ')}`,
    });
  }
  
  // CHECK: SDK/Cloud/CLI tabs should match live site tabs
  const tabsCheck = await Promise.all([
    livePage.evaluate(() => {
      // Look for tab-like buttons on live site
      const tabs = document.querySelectorAll('.w-tab-link, [role="tab"], button');
      return Array.from(tabs)
        .map(t => t.innerText?.trim().toUpperCase())
        .filter(t => ['SDK', 'CLOUD', 'CLI'].includes(t));
    }),
    testPage.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons)
        .map(btn => btn.innerText?.trim().toUpperCase())
        .filter(t => ['SDK', 'CLOUD', 'CLI'].includes(t));
    }),
  ]);
  
  const [liveTabs, testTabs] = tabsCheck;
  const liveTabSet = new Set(liveTabs);
  const testTabSet = new Set(testTabs);
  
  const missingTabs = [...liveTabSet].filter(tab => !testTabSet.has(tab));
  if (missingTabs.length > 0) {
    issues.push({
      check: 'SDK/Cloud/CLI Tabs',
      status: 'FAIL',
      message: `Tabs on live but missing from test: ${missingTabs.join(', ')}`,
    });
  }
  
  // CHECK: Navigation links should match live site
  const navCheck = await Promise.all([
    livePage.evaluate(() => {
      const nav = document.querySelector('header nav, header, .nav_menu');
      if (!nav) return [];
      const links = nav.querySelectorAll('a');
      return Array.from(links)
        .map(a => a.innerText?.trim().toLowerCase())
        .filter(t => t && t.length > 0 && !t.includes('\n'));
    }),
    testPage.evaluate(() => {
      const nav = document.querySelector('header nav, header');
      if (!nav) return [];
      const links = nav.querySelectorAll('a');
      return Array.from(links)
        .map(a => a.innerText?.trim().toLowerCase())
        .filter(t => t && t.length > 0 && !t.includes('\n'));
    }),
  ]);
  
  const [liveNavLinks, testNavLinks] = navCheck;
  // Find nav links on live site that are missing from test
  const testNavSet = new Set(testNavLinks);
  const missingNav = liveNavLinks.filter(link => 
    // Check if any test link contains this live link text
    !testNavLinks.some(testLink => testLink.includes(link) || link.includes(testLink))
  );
  
  // Filter to only important nav items (exclude things like empty strings, icons)
  const importantMissing = missingNav.filter(link => 
    link.length > 2 && 
    ['product', 'enterprise', 'pricing', 'community', 'benchmarks', 'resources'].some(key => link.includes(key))
  );
  
  if (importantMissing.length > 0) {
    issues.push({
      check: 'Navigation Links',
      status: 'FAIL',
      message: `Nav links on live but missing from test: ${importantMissing.join(', ')}`,
    });
  }
  
  return issues;
}

async function main() {
  console.log('🏴‍☠️ Visual Parity Validation');
  console.log('============================\n');
  console.log(`Test site: ${TEST_SITE}\n`);
  
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
    
    // Wait for animations to settle
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('Running visual checks...\n');
    
    const issues = await runChecks(livePage, testPage);
    
    // Report results
    const checks = [
      // Category: Opacity/Transparency
      'Banner Background Opacity',
      'ASCII Text Opacity',
      // Category: Color matching
      'ASCII Text Color',
      // Category: Font size comparison
      'ASCII Font Size Match',
      // Category: Element dimensions
      'Header Height',
      'Header Padding',
      'Header Inner Width',
      'Logo Width',
      'Logo Height',
      'Feature Item Width',
      'Section Width',
      'Trust Logo Width',
      'Trust Logo Opacity',
      'Navigation Font Size',
      // Structure checks
      'Header Buttons Single Line',
      'GitHub Stars Format', 
      'ASCII Background Presence',
      'Hero H1',
      'Hero Banner',
      'Hero CTA Buttons',
      'Trust Logos Section',
      'SDK/Cloud/CLI Tabs',
      'Navigation Links',
    ];
    
    const failedChecks = new Set(issues.map(i => i.check));
    
    console.log('📋 VISUAL PARITY CHECKS');
    console.log('─'.repeat(40));
    
    checks.forEach(check => {
      if (failedChecks.has(check)) {
        const issue = issues.find(i => i.check === check);
        console.log(`❌ ${check}`);
        console.log(`   ${issue.message}`);
      } else {
        console.log(`✅ ${check}`);
      }
    });
    
    console.log('\n' + '═'.repeat(40));
    
    if (issues.length === 0) {
      console.log('🎉 All visual parity checks PASSED!\n');
      process.exit(0);
    } else {
      console.log(`\n❌ ${issues.length} check(s) FAILED\n`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error during validation:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
