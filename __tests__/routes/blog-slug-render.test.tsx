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
      authors: [{ name: 'OpenHands Team', picture: null, link: null }],
      excerpt: 'Featured excerpt',
      ogImage: '/cover.png',
      seoTitleDate: 'Jan 28, 2026',
      url: 'https://example.com/blog/openhands-index',
      articleHighlights: [
        {
          title: 'The Software Agent Control Plane',
          date: '2026-04-03T12:00:00.000Z',
          cover: '/agent-control-plane.png',
          href: '/blog/agent-control-plane',
        },
        {
          title: 'EvoClaw: Evaluating AI Agents on Continuous Software Evolution',
          date: '2026-03-23T12:00:00.000Z',
          cover: '/evoclaw.png',
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
    render(<BlogDetails />);

    expect(screen.getByRole('link', { name: '← Back to Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.getByText('Published on')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Citation/i })).toBeInTheDocument();

    const relatedPostLink = screen
      .getByText('The Software Agent Control Plane')
      .closest('a');

    expect(relatedPostLink).toHaveAttribute('href', '/blog/agent-control-plane');
    expect(screen.getByRole('heading', { level: 1, name: 'Get useful insights in our blog' })).toBeInTheDocument();
    expect(screen.getByText('Building the open standard for autonomous software development.')).toBeInTheDocument();
  });
});
