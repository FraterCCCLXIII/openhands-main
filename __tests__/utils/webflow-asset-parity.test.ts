import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  backgroundImagesMatch,
  normalizeAssetIdentifier,
}: {
  backgroundImagesMatch: (liveValue: string, testValue: string, liveOrigin: string, testOrigin: string) => boolean;
  normalizeAssetIdentifier: (input: string, origin?: string) => string | null;
} = require('../../scripts/lib/webflow-asset-parity.cjs');

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const srcRoot = path.join(repoRoot, 'src');

const getRuntimeSourceFiles = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return getRuntimeSourceFiles(fullPath);
    return /\.(ts|tsx|md|css)$/.test(entry.name) ? [fullPath] : [];
  });
};

describe('Webflow asset localization', () => {
  it('normalizes hashed and local asset filenames to the same identifier', () => {
    expect(
      normalizeAssetIdentifier(
        'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69c325c02839d67f16aa2af7_Tools%20Icon.svg',
        'https://openhands.dev',
      ),
    ).toBe('tools-icon.svg');

    expect(normalizeAssetIdentifier('/assets/webflow/icons/Tools_Icon.svg', 'http://localhost:12001')).toBe(
      'tools-icon.svg',
    );

    expect(
      normalizeAssetIdentifier(
        '/assets/webflow/blog/69162ffa4334ae0267ee1c57_Screenshot_2025-11-13_at_11.22.26_AM-p-500.png',
        'http://localhost:12001',
      ),
    ).toBe('screenshot-2025-11-13-at-11.22.26-am.png');
  });

  it('treats live and local background-image URLs as equivalent when only hashes differ', () => {
    expect(
      backgroundImagesMatch(
        'url("https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69c325c02839d67f16aa2af7_Tools%20Icon.svg")',
        'url("http://localhost:12001/assets/webflow/icons/Tools_Icon.svg")',
        'https://openhands.dev',
        'http://localhost:12001',
      ),
    ).toBe(true);

    expect(
      backgroundImagesMatch(
        'url("https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69c325c02839d67f16aa2af7_Tools%20Icon.svg")',
        'url("http://localhost:12001/assets/webflow/icons/Search_Icon.svg")',
        'https://openhands.dev',
        'http://localhost:12001',
      ),
    ).toBe(false);
  });

  it('keeps runtime source files free of direct Webflow CDN references', () => {
    const filesWithRemoteUrls = getRuntimeSourceFiles(srcRoot)
      .map((filePath) => ({
        relativePath: path.relative(repoRoot, filePath),
        content: fs.readFileSync(filePath, 'utf-8'),
      }))
      .filter(({ content }) => content.includes('https://cdn.prod.website-files.com/'))
      .map(({ relativePath }) => relativePath);

    expect(filesWithRemoteUrls).toEqual([]);
  });
});
