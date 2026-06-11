import { describe, expect, it } from 'vitest';
import { getBlogPreviewText } from '../../src/utils/blog-preview';

describe('getBlogPreviewText', () => {
  it('prefers frontmatter excerpt when available', () => {
    expect(
      getBlogPreviewText({
        content: '# Title\n\nBody copy from markdown.',
        data: { excerpt: 'Short excerpt.' } as Post['data'],
      }),
    ).toBe('Short excerpt.');
  });

  it('falls back to plain text from markdown content', () => {
    expect(
      getBlogPreviewText({
        content: '# Title\n\nFirst paragraph with **bold** text.',
        data: { excerpt: '' } as Post['data'],
      }),
    ).toBe('Title First paragraph with bold text.');
  });
});
