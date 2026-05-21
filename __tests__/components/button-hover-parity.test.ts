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

describe('CTA button hover parity', () => {
  it('uses Webflow-like inset overlay hover effects for shared CTA variants', () => {
    expect(cssBlock('.btn-primary:hover')).toContain('box-shadow: inset 0 0 0 100px rgba(0, 0, 0, 0.15);');
    expect(cssBlock('.btn-outline:hover')).toContain('box-shadow: inset 0 0 0 100px rgba(0, 0, 0, 0.15);');
    expect(css).toContain('.btn-wrap-primary:hover');
    expect(cssBlock('.btn-outline:hover')).not.toContain('@apply bg-brand-fg text-brand-bg;');
    expect(cssBlock('.btn-primary:hover')).not.toContain('opacity: 0.92;');
  });

  it('keeps workflow card CTA hover aligned with live Webflow', () => {
    expect(css).toContain('.capabilities_card_button:hover');
    expect(css).toContain('background-color: rgb(34, 21, 13);');
    expect(css).toContain('color: rgb(249, 240, 217);');
  });

  it('uses native Webflow modal backdrop styling for workflow dialog', () => {
    const backdrop = cssBlock('.dialog::backdrop');
    expect(backdrop).toContain('background-color: rgba(32, 21, 14, 0.5);');
    expect(backdrop).toContain('backdrop-filter: blur(8px);');
    expect(cssBlock('.dialog .button')).toContain('border-radius: 8px;');
  });
});
