import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BlogCard, FeaturedBlogCard } from '../../src/components/blog-card';

describe('BlogCard', () => {
  it('renders the compact live-style card metadata', () => {
    render(
      <BlogCard
        title='Velocity Is Dead'
        date='2026-02-19T12:00:00.000Z'
        img='/assets/example.png'
      />
    );

    expect(screen.getByText('February 19, 2026')).toBeInTheDocument();
    expect(screen.getByText('Velocity Is Dead')).toBeInTheDocument();
    expect(screen.queryByText('Read More')).not.toBeInTheDocument();
  });

  it('renders the featured overlay card copy', () => {
    render(
      <FeaturedBlogCard
        title='Introducing the OpenHands Index'
        description='A comprehensive benchmark for agentic software engineering models.'
        img='/assets/featured.png'
      />
    );

    expect(screen.getByTestId('featured-blog-card')).toBeInTheDocument();
    expect(screen.getByText('Introducing the OpenHands Index')).toBeInTheDocument();
    expect(screen.getByText('Read more')).toBeInTheDocument();
  });
});
