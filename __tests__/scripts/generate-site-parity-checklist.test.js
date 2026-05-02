import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PNG } from 'pngjs';

const require = createRequire(import.meta.url);
const { capturePageScreenshot } = require('../../scripts/generate-site-parity-checklist.cjs');

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
