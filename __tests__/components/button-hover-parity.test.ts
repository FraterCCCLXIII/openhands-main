import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const css = fs.readFileSync(path.join(repoRoot, 'src/index.css'), 'utf-8');
const cssBlock = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return '';
  const end = css.indexOf('}', start);
  return css.slice(start, end + 1);
};

describe('CTA button hover styles', () => {
  it('uses a simple opacity hover for shared CTA variants', () => {
    expect(css).toContain('.btn-primary:hover');
    expect(css).toContain('.btn-wrap-primary:hover');
    expect(css).toMatch(/\.btn:hover,\s*\n\s*\.btn-primary:hover[\s\S]*?opacity:\s*0\.8;/);
    expect(css).not.toContain('box-shadow: inset 0 0 0 100px rgba(0, 0, 0, 0.15);');
  });

  it('applies the same opacity hover to workflow card CTAs', () => {
    expect(cssBlock('.capabilities_card_button:hover')).toContain('opacity: 0.8;');
    expect(cssBlock('.capabilities_card_button:hover')).not.toContain('background-color: rgb(34, 21, 13);');
  });

  it('uses native Webflow modal backdrop styling for workflow dialog', () => {
    const backdrop = cssBlock('.dialog::backdrop');
    expect(backdrop).toContain('background-color: rgba(32, 21, 14, 0.5);');
    expect(backdrop).toContain('backdrop-filter: blur(8px);');
    expect(cssBlock('.dialog .button')).toContain('border-radius: 8px;');
  });
});
