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
  it('renders the typography-first blog index card without images', () => {
    render(
      <BlogCard
        title='Velocity Is Dead'
        date='2026-02-18T12:00:00.000Z'
        href='/blog/velocity-is-dead'
        excerpt='What really matters when velocity of code creation is no longer the bottleneck?'
        webflowIndexCard
      />
    );

    const card = screen.getByRole('link', { name: /February 18, 2026\s+Velocity Is Dead/i });

    expect(card).toHaveAttribute('href', '/blog/velocity-is-dead');
    expect(card).toHaveAttribute('data-wf-el', 'blog-item');
    expect(card).toHaveClass('blog-card--typography');
    expect(card).toHaveStyle({ maxWidth: '100%' });
    expect(screen.getByText('February 18, 2026')).toHaveAttribute('data-wf-el', 'paragraph-sm');
    expect(screen.getByText('Velocity Is Dead')).toHaveAttribute('data-wf-el', 'paragraph-lg');
    expect(screen.getByText(/What really matters when velocity/i)).toHaveClass('line-clamp-2');
    expect(card.querySelector('img')).not.toBeInTheDocument();
    expect(card.querySelector('[data-wf-el="standard-media"]')).not.toBeInTheDocument();
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

  it('renders the featured typography card copy', () => {
    render(
      <FeaturedBlogCard
        href='/blog/openhands-index'
        title='Introducing the OpenHands Index'
        description='A comprehensive benchmark for agentic software engineering models.'
      />
    );

    const featuredCard = screen.getByTestId('featured-blog-card');
    const readMoreLink = featuredCard.querySelector('a');

    expect(featuredCard).toBeInTheDocument();
    expect(featuredCard).toHaveClass('featured-blog-card--typography');
    expect(screen.getByText('Introducing the OpenHands Index')).toBeInTheDocument();
    expect(screen.getByText(/comprehensive benchmark/i)).toHaveClass('line-clamp-2');
    expect(readMoreLink).toHaveAttribute('href', '/blog/openhands-index');
    expect(featuredCard.querySelector('img')).not.toBeInTheDocument();
    expect(featuredCard.querySelector('[data-wf-el="standard-media"]')).not.toBeInTheDocument();
  });
});
