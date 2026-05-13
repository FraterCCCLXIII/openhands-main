import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PNG } from 'pngjs';

const require = createRequire(import.meta.url);
const {
  capturePageScreenshot,
  compareButtonComponents,
  compareContainerStyles,
  compareDynamicControlVisuals,
  compareDynamicMotion,
  comparePaintedLayers,
  compareDynamicSelectorUx,
  compareHoverEffects,
  compareInteractivity,
  compareStyleValue,
  compareWebflowElements,
  extractButtonComponents,
  normalizeFontFamily,
  normalizeTransition,
  primaryFontMatches,
} = require('../../scripts/generate-site-parity-checklist.cjs');

class FakeScreenshotPage {
  constructor({ width, height, color, failFullPage = false }) {
    this.metrics = { width, height };
    this.color = color;
    this.failFullPage = failFullPage;
    this.screenshotCalls = [];
    this.scrollPositions = [];
  }

  async evaluate(_callback, value) {
    if (typeof value === 'number') {
      this.scrollPositions.push(value);
      return undefined;
    }

    return this.metrics;
  }

  async screenshot(options = {}) {
    this.screenshotCalls.push(options);

    if (options.fullPage && this.failFullPage) {
      throw new Error('Page.captureScreenshot timed out');
    }

    const width = Math.floor(options.clip?.width || this.metrics.width);
    const height = Math.floor(options.clip?.height || this.metrics.height);
    const yOffset = Math.floor(options.clip?.y || 0);
    const png = new PNG({ width, height });

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        png.data[index] = this.color.r;
        png.data[index + 1] = (this.color.g + yOffset + y) % 256;
        png.data[index + 2] = this.color.b;
        png.data[index + 3] = 255;
      }
    }

    const buffer = PNG.sync.write(png);
    if (options.path) {
      await import('node:fs/promises').then(({ writeFile }) => writeFile(options.path, buffer));
    }
    return buffer;
  }
}

const tempDirs = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function temporaryPath(filename) {
  const dir = mkdtempSync(path.join(tmpdir(), 'parity-screenshot-test-'));
  tempDirs.push(dir);
  return path.join(dir, filename);
}

describe('parity screenshot capture', () => {
  it('captures tall pages in stitched chunks instead of one full-page screenshot', async () => {
    const page = new FakeScreenshotPage({
      width: 3,
      height: 7,
      color: { r: 10, g: 20, b: 30 },
    });
    const outputPath = temporaryPath('tall.png');

    const result = await capturePageScreenshot(page, outputPath, {
      chunkHeight: 3,
      chunkTriggerHeight: 6,
    });

    expect(result).toEqual({ mode: 'chunked', chunks: 3, width: 3, height: 7 });
    expect(page.screenshotCalls).toHaveLength(3);
    expect(page.screenshotCalls.map((call) => call.clip.y)).toEqual([0, 3, 6]);
    expect(page.screenshotCalls.map((call) => call.clip.height)).toEqual([3, 3, 1]);
    expect(page.scrollPositions).toEqual([0, 3, 6]);
    expect(page.screenshotCalls.some((call) => call.fullPage)).toBe(false);

    const stitched = PNG.sync.read(await readFile(outputPath));
    expect(stitched.width).toBe(3);
    expect(stitched.height).toBe(7);

    const pixelAt = (x, y) => {
      const index = (y * stitched.width + x) * 4;
      return Array.from(stitched.data.subarray(index, index + 4));
    };

    expect(pixelAt(1, 0)).toEqual([10, 20, 30, 255]);
    expect(pixelAt(1, 3)).toEqual([10, 23, 30, 255]);
    expect(pixelAt(1, 6)).toEqual([10, 26, 30, 255]);
  });

  it('retries with chunked capture when full-page capture times out', async () => {
    const page = new FakeScreenshotPage({
      width: 2,
      height: 5,
      color: { r: 42, g: 0, b: 7 },
      failFullPage: true,
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await capturePageScreenshot(page, temporaryPath('fallback.png'), {
      chunkHeight: 2,
      chunkTriggerHeight: 10,
      label: 'short but slow page',
    });

    expect(result).toEqual({ mode: 'chunked', chunks: 3, width: 2, height: 5 });
    expect(page.screenshotCalls[0]).toMatchObject({ fullPage: true });
    expect(page.screenshotCalls.slice(1).map((call) => call.clip.y)).toEqual([0, 2, 4]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('retrying chunked capture: Page.captureScreenshot timed out'),
    );
  });
});

describe('font family comparison', () => {
  it('normalizes font family strings by removing quotes and lowercasing', () => {
    const result = normalizeFontFamily('"Quincy CF", Georgia, serif');
    expect(result).toEqual(['quincy cf', 'georgia', 'serif']);
  });

  it('returns empty array for empty input', () => {
    expect(normalizeFontFamily('')).toEqual([]);
    expect(normalizeFontFamily(null)).toEqual([]);
    expect(normalizeFontFamily(undefined)).toEqual([]);
  });

  it('matches when primary font is the same regardless of fallbacks', () => {
    expect(primaryFontMatches('"Quincy CF", serif', '"Quincy CF", Georgia, serif')).toBe(true);
  });

  it('detects mismatch when primary fonts differ', () => {
    expect(primaryFontMatches('"Quincy CF", serif', '"Arial", sans-serif')).toBe(false);
  });

  it('matches when both are empty', () => {
    expect(primaryFontMatches('', '')).toBe(true);
  });

  it('compareStyleValue reports fontFamily mismatch with primary font names', () => {
    const result = compareStyleValue('fontFamily', '"Quincy CF", serif', '"Inter", sans-serif');
    expect(result).toBe('fontFamily: live=quincy cf test=inter');
  });

  it('compareStyleValue passes when primary font matches', () => {
    const result = compareStyleValue('fontFamily', '"Inter", sans-serif', '"Inter", Arial, sans-serif');
    expect(result).toBeNull();
  });
});

describe('transition normalization', () => {
  it('normalizes "all 0s ease 0s" to "none"', () => {
    expect(normalizeTransition('all 0s ease 0s')).toBe('none');
  });

  it('preserves real transition values', () => {
    expect(normalizeTransition('opacity 0.3s ease')).toBe('opacity 0.3s ease');
  });

  it('normalizes falsy values to "none"', () => {
    expect(normalizeTransition('')).toBe('none');
    expect(normalizeTransition(null)).toBe('none');
    expect(normalizeTransition(undefined)).toBe('none');
    expect(normalizeTransition('none')).toBe('none');
  });
});

describe('compareStyleValue extended properties', () => {
  it('detects cursor mismatch', () => {
    const result = compareStyleValue('cursor', 'pointer', 'auto');
    expect(result).toBe('cursor: live=pointer test=auto');
  });

  it('passes when cursor values match', () => {
    expect(compareStyleValue('cursor', 'pointer', 'pointer')).toBeNull();
  });

  it('normalizes letterSpacing: normal vs 0px', () => {
    expect(compareStyleValue('letterSpacing', 'normal', '0px')).toBeNull();
    expect(compareStyleValue('letterSpacing', '0px', 'normal')).toBeNull();
  });

  it('detects letterSpacing mismatch beyond tolerance', () => {
    const result = compareStyleValue('letterSpacing', '0px', '3px');
    expect(result).toBe('letterSpacing: live=0px test=3px');
  });

  it('normalizes textDecoration whitespace differences', () => {
    expect(compareStyleValue('textDecoration', 'none solid rgb(0, 0, 0)', 'none  solid  rgb(0, 0, 0)')).toBeNull();
  });

  it('passes transition comparison when both are effectively none', () => {
    expect(compareStyleValue('transition', 'none', 'all 0s ease 0s')).toBeNull();
  });

  it('detects real transition difference', () => {
    const result = compareStyleValue('transition', 'opacity 0.3s ease', 'none');
    expect(result).toContain('transition');
  });

  it('detects padding mismatch beyond tolerance', () => {
    const result = compareStyleValue('paddingTop', '10px', '25px');
    expect(result).toBe('paddingTop: live=10px test=25px');
  });

  it('allows padding within tolerance', () => {
    expect(compareStyleValue('paddingTop', '10px', '16px')).toBeNull();
  });
});

describe('container style comparison', () => {
  it('detects background color mismatch between containers', () => {
    const liveContainers = [
      { tag: 'SECTION', label: 'hero', style: { backgroundColor: 'rgb(249, 240, 217)' } },
    ];
    const testContainers = [
      { tag: 'SECTION', label: 'hero', style: { backgroundColor: 'rgb(255, 255, 255)' } },
    ];
    const diffs = compareContainerStyles(liveContainers, testContainers);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].diffs[0]).toContain('backgroundColor');
  });

  it('passes when container styles match', () => {
    const containers = [
      { tag: 'SECTION', label: 'hero', style: { backgroundColor: 'rgb(249, 240, 217)' } },
    ];
    const diffs = compareContainerStyles(containers, containers);
    expect(diffs).toHaveLength(0);
  });

  it('reports container count mismatches instead of silently comparing only the shorter list', () => {
    const live = [
      { tag: 'SECTION', label: 's1', style: { backgroundColor: 'rgb(0,0,0)' } },
      { tag: 'SECTION', label: 's2', style: { backgroundColor: 'rgb(255,255,255)' } },
    ];
    const test = [
      { tag: 'SECTION', label: 's1', style: { backgroundColor: 'rgb(0,0,0)' } },
    ];
    const diffs = compareContainerStyles(live, test);
    expect(diffs.some((diff) => diff.diffs.some((item) => item.includes('container count: live=2 test=1')))).toBe(true);
  });

  it('ignores min-height constraints that do not change rendered container size', () => {
    const live = [
      { tag: 'SECTION', label: 'hero', rect: { top: 0, left: 0, width: 1440, height: 816 }, style: { backgroundColor: 'rgb(249, 240, 217)', minHeight: 'auto' } },
    ];
    const test = [
      { tag: 'SECTION', label: 'hero', rect: { top: 0, left: 0, width: 1440, height: 816 }, style: { backgroundColor: 'rgb(249, 240, 217)', minHeight: '816px' } },
    ];

    expect(compareContainerStyles(live, test)).toHaveLength(0);
  });

  it('ignores inactive min-height constraints and small explicit height differences', () => {
    const live = [
      { tag: 'SECTION', label: 'cta', rect: { top: 0, left: 0, width: 1440, height: 1136 }, style: { backgroundColor: 'rgb(255, 255, 139)', minHeight: 'auto', height: '1136px' } },
    ];
    const test = [
      { tag: 'SECTION', label: 'cta', rect: { top: 0, left: 0, width: 1440, height: 1135 }, style: { backgroundColor: 'rgb(255, 255, 139)', minHeight: '1056px', height: '1135px' } },
    ];

    expect(compareContainerStyles(live, test)).toHaveLength(0);
  });
});

describe('interactivity comparison', () => {
  it('detects missing interactive elements on test', () => {
    const live = [
      { signature: 'BUTTON:sdk', tag: 'BUTTON', label: 'SDK', cursor: 'pointer', hasTransition: true, pointerEvents: 'auto' },
      { signature: 'BUTTON:gui', tag: 'BUTTON', label: 'GUI', cursor: 'pointer', hasTransition: true, pointerEvents: 'auto' },
    ];
    const test = [
      { signature: 'BUTTON:sdk', tag: 'BUTTON', label: 'SDK', cursor: 'pointer', hasTransition: true, pointerEvents: 'auto' },
    ];
    const result = compareInteractivity(live, test);
    expect(result.missingInteractive).toHaveLength(1);
    expect(result.missingInteractive[0].signature).toBe('BUTTON:gui');
  });

  it('detects cursor mismatch between interactive elements', () => {
    const live = [
      { signature: 'BUTTON:sdk', tag: 'BUTTON', label: 'SDK', cursor: 'pointer', hasTransition: false, pointerEvents: 'auto' },
    ];
    const test = [
      { signature: 'BUTTON:sdk', tag: 'BUTTON', label: 'SDK', cursor: 'auto', hasTransition: false, pointerEvents: 'auto' },
    ];
    const result = compareInteractivity(live, test);
    expect(result.interactivityDiffs).toHaveLength(1);
    expect(result.interactivityDiffs[0].diffs[0]).toContain('cursor');
  });

  it('detects transition mismatch between interactive elements', () => {
    const live = [
      { signature: 'A:learn more', tag: 'A', label: 'Learn more', cursor: 'pointer', hasTransition: true, pointerEvents: 'auto' },
    ];
    const test = [
      { signature: 'A:learn more', tag: 'A', label: 'Learn more', cursor: 'pointer', hasTransition: false, pointerEvents: 'auto' },
    ];
    const result = compareInteractivity(live, test);
    expect(result.interactivityDiffs).toHaveLength(1);
    expect(result.interactivityDiffs[0].diffs[0]).toContain('transition');
  });

  it('detects extra interactive elements on test', () => {
    const live = [];
    const test = [
      { signature: 'BUTTON:extra', tag: 'BUTTON', label: 'Extra', cursor: 'pointer', hasTransition: false, pointerEvents: 'auto' },
    ];
    const result = compareInteractivity(live, test);
    expect(result.extraInteractive).toHaveLength(1);
    expect(result.extraInteractive[0].signature).toBe('BUTTON:extra');
  });

  it('passes when interactive elements match', () => {
    const items = [
      { signature: 'BUTTON:sdk', tag: 'BUTTON', label: 'SDK', cursor: 'pointer', hasTransition: true, pointerEvents: 'auto' },
    ];
    const result = compareInteractivity(items, items);
    expect(result.missingInteractive).toHaveLength(0);
    expect(result.interactivityDiffs).toHaveLength(0);
    expect(result.extraInteractive).toHaveLength(0);
  });
});

describe('hover effect comparison', () => {
  it('detects hover effect present on live but missing on test', () => {
    const live = [
      { signature: 'BUTTON:sdk', hasHoverEffect: true, hoverChanges: [{ prop: 'bg', before: 'white', after: 'blue' }] },
    ];
    const test = [
      { signature: 'BUTTON:sdk', hasHoverEffect: false, hoverChanges: [] },
    ];
    const diffs = compareHoverEffects(live, test);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].issue).toBe('hover effect present on live but missing on test');
    expect(diffs[0].liveChanges).toEqual(['bg: white → blue']);
  });

  it('detects hover effect present on test but missing on live', () => {
    const live = [
      { signature: 'A:link', hasHoverEffect: false, hoverChanges: [] },
    ];
    const test = [
      { signature: 'A:link', hasHoverEffect: true, hoverChanges: [{ prop: 'color', before: 'black', after: 'red' }] },
    ];
    const diffs = compareHoverEffects(live, test);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].issue).toBe('hover effect present on test but missing on live');
  });

  it('passes when hover effects match', () => {
    const items = [
      { signature: 'BUTTON:go', hasHoverEffect: true, hoverChanges: [{ prop: 'bg', before: 'a', after: 'b' }] },
    ];
    const diffs = compareHoverEffects(items, items);
    expect(diffs).toHaveLength(0);
  });

  it('ignores elements only present on one side', () => {
    const live = [{ signature: 'BUTTON:only-live', hasHoverEffect: true, hoverChanges: [] }];
    const test = [{ signature: 'BUTTON:only-test', hasHoverEffect: true, hoverChanges: [] }];
    const diffs = compareHoverEffects(live, test);
    expect(diffs).toHaveLength(0);
  });
});

describe('dynamic widget control visual comparison', () => {
  const controlStyle = {
    display: 'block',
    position: 'static',
    fontFamily: 'Sohne Mono, monospace',
    fontSize: '12px',
    lineHeight: '14px',
    fontWeight: '400',
    color: 'rgb(34, 21, 13)',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderColor: 'rgb(34, 21, 13)',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '999px',
    paddingTop: '4px',
    paddingRight: '8px',
    paddingBottom: '4px',
    paddingLeft: '8px',
    marginTop: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    opacity: '1',
    cursor: 'pointer',
    textAlign: 'left',
  };

  const control = (label, overrides = {}) => ({
    label,
    visible: true,
    rect: { top: 100, left: 20, width: 48, height: 22, ...(overrides.rect || {}) },
    relativeToRoot: { top: 10, left: 0, bottom: 32, right: 48, ...(overrides.relativeToRoot || {}) },
    relativeToMedia: { top: -40, left: -300, bottom: -18, right: -252, ...(overrides.relativeToMedia || {}) },
    style: { ...controlStyle, ...(overrides.style || {}) },
    effectiveOpacity: overrides.effectiveOpacity ?? 1,
  });

  const widget = (controls, controlGroup = {}) => ({
    present: true,
    visibleControlLabels: controls.map((item) => item.label),
    controls,
    renderedPanelLabels: ['SDK', 'Cloud', 'CLI'],
    clickActivePanels: ['SDK', 'Cloud', 'CLI'],
    scrollActivePanels: [],
    mediaVisibleSampleCount: 0,
    mediaToNextSectionGap: 128,
    controlGroup: {
      rect: { top: 100, left: 20, width: 170, height: 22, ...(controlGroup.rect || {}) },
      relativeToRoot: { top: 10, left: 0, bottom: 32, right: 170, ...(controlGroup.relativeToRoot || {}) },
      relativeToMedia: { top: -40, left: -300, bottom: -18, right: -130, ...(controlGroup.relativeToMedia || {}) },
      style: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        gap: '0px',
        rowGap: '0px',
        columnGap: '0px',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        ...(controlGroup.style || {}),
      },
    },
  });

  it('detects control styling and position differences even when switching works', () => {
    const live = widget([control('SDK'), control('Cloud'), control('CLI')]);
    const test = widget([
      control('SDK', {
        rect: { top: 148, left: 40, width: 72, height: 30 },
        relativeToRoot: { top: 58, left: 20 },
        style: {
          fontSize: '14px',
          backgroundColor: 'rgb(34, 21, 13)',
          color: 'rgb(249, 240, 217)',
          borderRadius: '20px',
          paddingLeft: '12px',
          paddingRight: '12px',
        },
      }),
      control('Cloud'),
      control('CLI'),
    ], {
      relativeToRoot: { top: 58, left: 20 },
      style: { gap: '8px' },
    });

    const result = compareDynamicSelectorUx(live, test);

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'control-style-mismatch', label: 'SDK' }),
        expect.objectContaining({ type: 'control-position-mismatch', label: 'SDK' }),
        expect.objectContaining({ type: 'control-group-layout-mismatch' }),
      ]),
    );
  });

  it('passes control visual comparison for matching controls', () => {
    const live = widget([control('SDK'), control('Cloud'), control('CLI')]);
    const test = widget([control('SDK'), control('Cloud'), control('CLI')]);

    expect(compareDynamicControlVisuals(live, test)).toHaveLength(0);
  });
});

describe('generalized visual parity comparisons', () => {
  it('reports repeated Webflow/data-wf element count mismatches', () => {
    const live = [
      { key: 'ascii-pre', tag: 'PRE', style: {}, rect: { top: 0, left: 0, width: 100, height: 100 } },
      { key: 'ascii-pre', tag: 'PRE', style: {}, rect: { top: 120, left: 0, width: 100, height: 100 } },
    ];
    const test = [
      { key: 'ascii-pre', tag: 'PRE', style: {}, rect: { top: 0, left: 0, width: 100, height: 100 } },
    ];

    const result = compareWebflowElements(live, test);

    expect(result.countMismatches).toEqual([
      expect.objectContaining({ key: 'ascii-pre', liveCount: 2, testCount: 1 }),
    ]);
  });

  it('detects missing runtime motion by stable signature', () => {
    const live = [
      { signature: 'wf:ascii-pre', tag: 'PRE', hasRuntimeMotion: true, changedFields: ['contentHash'], mutationCount: 3 },
    ];
    const test = [
      { signature: 'wf:ascii-pre', tag: 'PRE', hasRuntimeMotion: false, changedFields: [], mutationCount: 0 },
    ];

    const result = compareDynamicMotion(live, test);

    expect(result.missingMotion).toHaveLength(1);
    expect(result.missingMotion[0].signature).toBe('wf:ascii-pre');
  });

  it('detects painted layer count and style differences', () => {
    const base = { tag: 'DIV', rect: { area: 1000 }, pseudo: {}, style: { backgroundColor: 'rgb(34, 21, 13)', opacity: '1', effectiveOpacity: 1 } };
    const result = comparePaintedLayers(
      [{ ...base, key: 'wf:asci-wrap' }, { ...base, key: 'wf:asci-wrap' }],
      [{ ...base, key: 'wf:asci-wrap', style: { ...base.style, backgroundColor: 'rgb(255, 255, 139)' } }],
    );

    expect(result.countDiffs).toEqual([
      expect.objectContaining({ key: 'wf:asci-wrap', liveCount: 2, testCount: 1 }),
    ]);
    expect(result.styleDiffs[0].diffs.some((diff) => diff.startsWith('backgroundColor:'))).toBe(true);
  });

  it('matches painted layers by geometry when semantic keys differ', () => {
    const live = {
      key: 'section:0',
      tag: 'SECTION',
      rect: { top: 100, left: 0, width: 1200, height: 500, area: 600000 },
      pseudo: {},
      style: { backgroundColor: 'rgb(34, 21, 13)', opacity: '1', effectiveOpacity: 1 },
    };
    const test = {
      ...live,
      key: 'wf:section',
      rect: { top: 104, left: 0, width: 1200, height: 500, area: 600000 },
      style: { ...live.style, backgroundColor: 'rgb(249, 240, 217)' },
    };

    const result = comparePaintedLayers([live], [test]);

    expect(result.missing).toHaveLength(0);
    expect(result.extra).toHaveLength(0);
    expect(result.styleDiffs[0]).toEqual(expect.objectContaining({ key: 'section:0 ↔ wf:section' }));
  });

  it('does not report position-only differences as painted-layer style mismatches', () => {
    const live = {
      key: 'wf:card-body',
      tag: 'DIV',
      rect: { top: 100, left: 0, width: 1200, height: 500, area: 600000 },
      pseudo: {},
      style: { backgroundColor: 'rgb(249, 240, 217)', position: 'relative', opacity: '1', effectiveOpacity: 1 },
    };
    const test = {
      ...live,
      style: { ...live.style, position: 'static' },
    };

    const result = comparePaintedLayers([live], [test]);

    expect(result.styleDiffs).toHaveLength(0);
  });

  it('leaves button paint to the specialized button audit', () => {
    const buttonLayer = {
      key: 'wf:btn-wrap-primary',
      tag: 'DIV',
      rect: { top: 10, left: 10, width: 160, height: 54, area: 8640 },
      pseudo: {},
      style: { backgroundColor: 'rgb(34, 21, 13)', opacity: '1', effectiveOpacity: 1 },
    };

    const result = comparePaintedLayers([], [buttonLayer]);

    expect(result.extra).toHaveLength(0);
  });

  it('detects button wrapper visual contract mismatches', () => {
    const base = {
      signature: 'button:build with sdk',
      label: 'Build with SDK',
      variant: 'primary',
      rect: { width: 150, height: 50 },
      style: { backgroundColor: 'rgb(34, 21, 13)', borderColor: 'rgb(34, 21, 13)', borderWidth: '1px', opacity: '1', effectiveOpacity: 1 },
    };

    const result = compareButtonComponents(
      [base],
      [{ ...base, variant: 'secondary', style: { ...base.style, backgroundColor: 'rgba(255, 255, 255, 0.34)' } }],
    );

    expect(result.mismatches[0].diffs).toEqual(
      expect.arrayContaining([
        'variant: live=primary test=secondary',
        expect.stringContaining('backgroundColor:'),
      ]),
    );
  });

  it('extracts button components by visible label instead of sr-only overlay label', async () => {
    document.body.innerHTML = `
      <div class="btn-wrap-primary">
        <div aria-hidden="true">Try it live</div>
        <a href="/join" aria-label="Join Slack"><span class="sr-only">Join Slack</span></a>
      </div>
    `;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 20,
      right: 140,
      bottom: 72,
      width: 120,
      height: 52,
      x: 20,
      y: 10,
      toJSON: () => ({}),
    });

    const buttons = await extractButtonComponents({ evaluate: async (callback) => callback() });

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toEqual(expect.objectContaining({
      label: 'Try it live',
      signature: 'button:try it live',
    }));
  });

  it('extracts Webflow button-N roots as button components', async () => {
    document.body.innerHTML = `
      <div class="button-3">
        <div aria-hidden="true" class="btn-text-3">Book a demo</div>
        <a href="/contact"><span class="sr-only">Book a demo</span></a>
      </div>
    `;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 20,
      right: 140,
      bottom: 72,
      width: 120,
      height: 52,
      x: 20,
      y: 10,
      toJSON: () => ({}),
    });

    const buttons = await extractButtonComponents({ evaluate: async (callback) => callback() });

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toEqual(expect.objectContaining({
      label: 'Book a demo',
      signature: 'button:book a demo',
    }));
  });
});
