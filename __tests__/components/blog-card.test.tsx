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

    expect(screen.getByRole('link', { name: 'The Software Agent Control Plane' })).toHaveAttribute(
      'href',
      '/blog/agent-control-plane'
    );
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

    expect(screen.getByTestId('featured-blog-card')).toBeInTheDocument();
    expect(screen.getByText('Introducing the OpenHands Index')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Read more' })).toHaveAttribute(
      'href',
      '/blog/openhands-index'
    );
    expect(screen.getByTestId('featured-blog-card').querySelector('img')?.getAttribute('alt')).toBe('');
  });
});
