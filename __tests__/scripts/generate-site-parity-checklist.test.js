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
  compareContainerStyles,
  compareHoverEffects,
  compareInteractivity,
  compareStyleValue,
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

  it('only compares up to the shorter container list', () => {
    const live = [
      { tag: 'SECTION', label: 's1', style: { backgroundColor: 'rgb(0,0,0)' } },
      { tag: 'SECTION', label: 's2', style: { backgroundColor: 'rgb(255,255,255)' } },
    ];
    const test = [
      { tag: 'SECTION', label: 's1', style: { backgroundColor: 'rgb(0,0,0)' } },
    ];
    const diffs = compareContainerStyles(live, test);
    expect(diffs).toHaveLength(0);
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
