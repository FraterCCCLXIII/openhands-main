import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('font-face parity', () => {
  it('uses the exact live Webflow OTF font assets for brand fonts', () => {
    const css = readFileSync('src/index.css', 'utf8');

    expect(css).toContain('url("/assets/fonts/Sohne-Kraftig.otf") format("opentype")');
    expect(css).toContain('url("/assets/fonts/Sohne-Buch.otf") format("opentype")');
    expect(css).toContain('font-family: "Geistmono"');
    expect(css).toContain('url("/assets/fonts/GeistMono-Regular.otf") format("opentype")');
    expect(css).not.toContain('/assets/fonts/Sohne-Kraftig.woff2');
    expect(css).not.toContain('/assets/fonts/Sohne-Buch.woff2');
    expect(css).not.toContain('/assets/fonts/GeistMono-Regular.woff2');
  });
});
