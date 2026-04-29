import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CMarkdown } from '../../src/components/c-markdown';

describe('CMarkdown', () => {
  it('applies blog variant typography and link styling', () => {
    render(
      <CMarkdown variant='blog'>
        {'# Title\n\n## Subtitle\n\nA [link](https://example.com) with `code`.\n\n![Alt text](https://example.com/image.png)'}
      </CMarkdown>
    );

    const title = screen.getByRole('heading', { level: 1, name: 'Title' });
    const subtitle = screen.getByRole('heading', { level: 2, name: 'Subtitle' });
    const link = screen.getByRole('link', { name: 'link' });
    const image = screen.getByAltText('Alt text');

    expect(title.className).toContain('lg:text-[44px]');
    expect(subtitle.className).toContain('font-medium');
    expect(link.className).toContain('text-brand-brown');
    expect(link.className).toContain('leading-[22.4px]');
    expect(screen.getByText('code').className).toContain('bg-brand-fg');
    expect(image.className).toContain('rounded-[8px]');
  });
});
