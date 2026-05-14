import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CMarkdown } from '../../src/components/c-markdown';

describe('CMarkdown', () => {
  it('applies blog variant typography without adding wrapper gap spacing', () => {
    const { container } = render(
      <CMarkdown variant='blog'>
        {'# Title\n\n## Subtitle\n\nA [link](https://example.com) with `code`.\n\n![Alt text](https://example.com/image.png)'}
      </CMarkdown>
    );

    const title = screen.getByRole('heading', { level: 1, name: 'Title' });
    const subtitle = screen.getByRole('heading', { level: 2, name: 'Subtitle' });
    const link = screen.getByRole('link', { name: 'link' });
    const image = screen.getByAltText('Alt text');

    expect(container.firstElementChild?.className).toBe('');
    expect(title.className).toContain('lg:text-[44px]');
    expect(subtitle.className).toContain('font-medium');
    expect(link.className).toContain('text-brand-brown');
    expect(link.className).toContain('text-[16px]');
    expect(link.className).toContain('leading-[22.4px]');
    expect(screen.getByText('code').className).toContain('bg-brand-fg');
    expect(image.className).toContain('rounded-none');
    expect(image.className).not.toContain('my-10');
    expect(title.className).toContain('mt-[44px]');
    expect(subtitle.className).toContain('mb-[8.8px]');
  });


  it('centers Webflow rich text figures at the live image width', () => {
    const { container } = render(
      <CMarkdown variant='blog'>
        {'<figure class="w-richtext-align-center w-richtext-figure-type-image"><div><img src="https://example.com/chart.png" alt="Chart" /></div></figure>'}
      </CMarkdown>
    );

    const figure = container.querySelector('figure');
    const image = screen.getByAltText('Chart');

    expect(figure?.className).toContain('my-[3em]');
    expect(figure?.className).toContain('mx-auto');
    expect(figure?.className).toContain('[&_img]:max-w-full');
    expect(figure?.className).toContain('[&_img]:w-auto');
    expect(image.className).toContain('rounded-none');
    expect(image.className).not.toContain('my-[3em]');
  });

  it('keeps markdown-like content inside raw HTML pre blocks out of the document structure', () => {
    const { container } = render(
      <CMarkdown variant='blog'>
        {
          '<p>Intro</p><pre><code>---\n# Python Code Review\n### 2. [HIGH] Premature Approval of Flawed PRs\n[GitHub repository](https://github.com/OpenHands/OpenHands)\n</code></pre><h2>Next Steps</h2>'
        }
      </CMarkdown>
    );

    const pre = container.querySelector('pre');

    expect(pre?.textContent).toContain('# Python Code Review');
    expect(pre?.textContent).toContain('### 2. [HIGH] Premature Approval of Flawed PRs');
    expect(pre?.textContent).toContain(
      '[GitHub repository](https://github.com/OpenHands/OpenHands)'
    );
    expect(pre?.textContent?.startsWith('---')).toBe(true);
    expect(pre?.className).toContain('my-[15px]');
    expect(pre?.className).toContain('[&_code]:!inline-block');
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Python Code Review' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 3,
        name: '2. [HIGH] Premature Approval of Flawed PRs',
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'GitHub repository' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Next Steps' })).toBeInTheDocument();
  });
});
