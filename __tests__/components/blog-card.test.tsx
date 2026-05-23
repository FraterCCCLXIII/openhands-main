import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlogCard, FeaturedBlogCard } from '../../src/components/blog-card';

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={typeof to === 'string' ? to : '#'} {...props}>
      {children}
    </a>
  ),
}));

describe('BlogCard', () => {
  it('renders the compact live-style card metadata', () => {
    render(
      <BlogCard
        title='Velocity Is Dead'
        date='2026-02-18T12:00:00.000Z'
        href='/blog/velocity-is-dead'
        img='/assets/example.png'
      />
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/blog/velocity-is-dead');
    expect(screen.getByText('February 18, 2026')).toBeInTheDocument();
    expect(screen.getByText('Velocity Is Dead')).toBeInTheDocument();
    expect(screen.getByAltText('Velocity Is Dead cover image')).toBeInTheDocument();
    expect(screen.queryByText('Read More')).not.toBeInTheDocument();
  });

  it('can mirror the live /blog grid Webflow element structure', () => {
    render(
      <BlogCard
        title='OpenHands Product Update - May 2026'
        date='2026-05-20T12:00:00.000Z'
        href='/blog/openhands-product-update---may-2026'
        img='/assets/update.png'
        webflowIndexCard
        verticalOffset={49}
      />
    );

    const card = screen.getByRole('link', { name: /May 20, 2026\s+OpenHands Product Update/i });

    expect(card).toHaveAttribute('data-wf-el', 'blog-item');
    expect(card).toHaveStyle({ maxWidth: '100%', top: '-49px' });
    expect(card.querySelector('[data-wf-el="standard-media"]')).toBeInTheDocument();
    expect(card.querySelector('img')).toHaveAttribute('data-wf-el', 'standard-media-img');
    expect(screen.getByText('May 20, 2026')).toHaveAttribute('data-wf-el', 'paragraph-sm');
    expect(screen.getByText('OpenHands Product Update - May 2026')).toHaveAttribute('data-wf-el', 'paragraph-lg');
  });

  it('supports title-only related cards without visible dates', () => {
    render(
      <BlogCard
        title='The Software Agent Control Plane'
        href='/blog/agent-control-plane'
        img='/assets/agent-control-plane.png'
        imgAlt=''
        showDate={false}
        titleLinkOnly
      />
    );

    const relatedLink = screen.getByRole('link', { name: 'The Software Agent Control Plane' });

    expect(relatedLink).toHaveAttribute('href', '/blog/agent-control-plane');
    expect(relatedLink.querySelector('img')).toBeInTheDocument();
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
    expect(document.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('renders the featured overlay card copy', () => {
    render(
      <FeaturedBlogCard
        href='/blog/openhands-index'
        title='Introducing the OpenHands Index'
        description='A comprehensive benchmark for agentic software engineering models.'
        img='/assets/featured.png'
        imgAlt=''
      />
    );

    const featuredCard = screen.getByTestId('featured-blog-card');
    const readMoreLink = featuredCard.querySelector('a');

    expect(featuredCard).toBeInTheDocument();
    expect(screen.getByText('Introducing the OpenHands Index')).toBeInTheDocument();
    expect(readMoreLink).toHaveAttribute('href', '/blog/openhands-index');
    const image = featuredCard.querySelector('img');

    expect(featuredCard).toHaveStyle({ height: '620px' });
    expect(featuredCard.querySelector('[data-wf-el="standard-media"]')).toHaveClass('h-full');
    expect(image?.getAttribute('alt')).toBe('');
    expect(image).toHaveClass('h-full', 'w-full', 'object-cover');
    expect(image?.className).not.toContain('transition-transform');
    expect(image?.className).not.toContain('group-hover:scale');
  });
});
