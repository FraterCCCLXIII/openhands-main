import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

const mockFeaturedBlog = {
  content: 'Featured',
  data: {
    title: 'Introducing the OpenHands Index',
    excerpt: 'Featured excerpt',
    coverImage: '/featured.png',
    featuredImage: '/featured-card.png',
    coverAlt: '',
    date: '2026-01-29T12:00:00.000Z',
    authors: [{ name: 'Author One', picture: '', link: '' }],
    ogImage: { url: '/featured.png' },
    slug: 'openhands-index',
  },
} as Post;

const mockGridBlogs = Array.from({ length: 7 }, (_, index) => ({
  content: `Post ${index + 1}`,
  data: {
    title: `Grid Post ${index + 1}`,
    excerpt: `Excerpt ${index + 1}`,
    coverImage: `/grid-${index + 1}.png`,
    date: `2026-03-0${index + 1}T12:00:00.000Z`,
    authors: [{ name: 'Author Two', picture: '', link: '' }],
    ogImage: { url: `/grid-${index + 1}.png` },
    slug: `grid-post-${index + 1}`,
  },
})) as Post[];

const mockSeoBlogs = Array.from({ length: 7 }, (_, index) => ({
  content: `SEO Post ${index + 1}`,
  data: {
    title: `SEO Post ${index + 1}`,
    excerpt: `SEO excerpt ${index + 1}`,
    coverImage: `/seo-${index + 1}.png`,
    date: `2026-04-0${index + 1}T12:00:00.000Z`,
    authors: [{ name: 'Author Three', picture: '', link: '' }],
    ogImage: { url: `/seo-${index + 1}.png` },
    slug: `seo-post-${index + 1}`,
    importance: 'SEO',
  },
})) as Post[];

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    Link: ({ children, to, ...props }: any) => (
      <a href={typeof to === 'string' ? to : '#'} {...props}>
        {children}
      </a>
    ),
    Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    useActionData: () => undefined,
    useLoaderData: () => ({ featuredBlog: mockFeaturedBlog, gridBlogs: mockGridBlogs, seoBlogs: mockSeoBlogs }),
    useNavigation: () => ({ state: 'idle' }),
  };
});

import Blog from '../../src/routes/blog';

describe('Blog route', () => {
  it('renders the pinned featured post and progressively reveals the blog grid', async () => {
    const user = userEvent.setup();
    const { container } = render(<MemoryRouter><Blog /></MemoryRouter>);

    const newsletterPrompt = screen.getByText(
      'Sign up for our newsletter for updates, events, and community insights.'
    );

    expect(container.querySelector('main')?.className).toContain('blog-index-page');
    expect(container.querySelector('main')?.className).toContain('flex flex-col');
    expect(container.querySelector('main')?.className).toContain('blog-index-page--with-seo');
    expect(container.querySelector('main')?.className).not.toContain('blog-index-page--expanded');
    expect(container.querySelector('[data-wf-el="hero-content"]')).toBeInTheDocument();
    expect(container.querySelector('[data-wf-el="section-hero"]')).toHaveClass('blog-hero');
    expect(container.querySelector('[data-wf-el="section-hero"] [data-wf-el="container"]')).toHaveClass('blog-hero-container');
    expect(container.querySelector('[data-wf-el="section-hero"] [data-wf-el="container"]')).toHaveClass('text-left');
    expect(screen.getByRole('heading', { name: 'OpenHands Blog' })).toHaveClass('text-left');
    expect(container.querySelector('.blog-featured-newsletter')).toBeInTheDocument();
    expect(container.querySelector('[data-wf-el="standard-collection-list-item"]')).toBeInTheDocument();
    expect(container.querySelector('.blog-grid-item')).toBeInTheDocument();
    expect(screen.getByText('Insights and updates from the OpenHands team')).toHaveAttribute('data-wf-el', 'paragraph-lg');
    expect(newsletterPrompt.className).toContain('text-[16px]');
    expect(screen.getByText('Introducing the OpenHands Index')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="featured-blog-card"] a')).toHaveAttribute(
      'href',
      '/blog/openhands-index'
    );
    expect(container.querySelector('[data-testid="featured-blog-card"] img')).not.toBeInTheDocument();
    expect(container.querySelector('.blog-card--typography img')).not.toBeInTheDocument();
    expect(container.querySelector('.blog-card--typography .line-clamp-2')).toBeInTheDocument();
    expect(screen.getByText('Grid Post 6')).toBeInTheDocument();
    expect(screen.queryByText('Grid Post 7')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'More articles' })).toBeInTheDocument();
    expect(screen.getByText('SEO Post 6')).toBeInTheDocument();
    expect(screen.queryByText('SEO Post 7')).not.toBeInTheDocument();
    expect(container.querySelector('#more-articles')?.querySelectorAll('img')).toHaveLength(0);
    expect(within(container.querySelector('#blog-grid')!).queryByText('SEO Post 1')).not.toBeInTheDocument();

    await user.click(container.querySelector('a[href="#blog-grid"]')!);

    expect(screen.getByText('Grid Post 7')).toBeInTheDocument();
    expect(container.querySelector('main')?.className).toContain('blog-index-page--expanded');

    await user.click(screen.getByRole('link', { name: 'Load more articles' }));

    expect(screen.getByText('SEO Post 7')).toBeInTheDocument();
    expect(
      screen.getByText('Building the open standard for autonomous software development.')
    ).toBeInTheDocument();
    expect(container.querySelector('section.bg-brand-accent [data-wf-el="container"]')).toBeInTheDocument();
    expect(screen.getByText(/OpenHands - All rights reserved/)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Building the open standard for autonomous software development.',
      })
    ).not.toBeInTheDocument();
  });
});
