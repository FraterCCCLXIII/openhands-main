import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BlogDetails from '../../src/routes/blog.$slug';

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
    useLoaderData: () => ({
      content: '# Introducing the OpenHands Index\n\nRead the [OpenHands Index](https://index.openhands.dev).',
      title: 'Introducing the OpenHands Index',
      date: '2026-01-29T12:00:00.000Z',
      cover: '/cover.png',
      coverAlt: '',
      authors: [{ name: 'OpenHands Team', picture: null, link: null }],
      excerpt: 'Featured excerpt',
      ogImage: '/cover.png',
      seoTitleDate: 'Jan 28, 2026',
      url: 'https://example.com/blog/openhands-index',
      articleHighlights: [
        {
          title: 'The Software Agent Control Plane',
          cover: '/agent-control-plane.png',
          coverAlt: 'The Software Agent Control Plane cover image',
          href: '/blog/agent-control-plane',
        },
        {
          title: 'EvoClaw: Evaluating AI Agents on Continuous Software Evolution',
          cover: '/evoclaw.png',
          coverAlt: '',
          href: '/blog/evoclaw-benchmark',
        },
      ],
    }),
    useNavigation: () => ({ state: 'idle' }),
    useRouteError: () => undefined,
  };
});

describe('Blog article route', () => {
  it('renders the live-style article chrome and footer sections', () => {
    const { container } = render(<BlogDetails />);

    expect(screen.getByRole('link', { name: '← Back to Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.getByText('Published on')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Citation/i })).toBeInTheDocument();

    const relatedPostLink = screen
      .getByText('The Software Agent Control Plane')
      .closest('a');

    expect(relatedPostLink).toHaveAttribute('href', '/blog/agent-control-plane');
    expect(screen.queryByText('April 3, 2026')).not.toBeInTheDocument();

    const coverImage = container.querySelector('article > div img');

    expect(coverImage?.getAttribute('alt')).toBe('');
    expect(coverImage?.className).toContain('h-auto');
    expect(coverImage?.className).not.toContain('aspect-[3/2]');
    expect(screen.getByRole('heading', { level: 1, name: 'Get useful insights in our blog' })).toBeInTheDocument();
    expect(
      screen.getByText('Building the open standard for autonomous software development.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Building the open standard for autonomous software development.',
      })
    ).not.toBeInTheDocument();
  });
});
