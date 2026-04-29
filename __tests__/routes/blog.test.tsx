import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockBlogs = [
  {
    content: 'Featured',
    data: {
      title: 'Featured Post',
      excerpt: 'Featured excerpt',
      coverImage: '/featured.png',
      date: '2026-06-10T12:00:00.000Z',
      authors: [{ name: 'Author One', picture: '', link: '' }],
      ogImage: { url: '/featured.png' },
    },
  },
  {
    content: 'Secondary',
    data: {
      title: 'Second Post',
      excerpt: 'Second excerpt',
      coverImage: '/second.png',
      date: '2026-06-01T12:00:00.000Z',
      authors: [{ name: 'Author Two', picture: '', link: '' }],
      ogImage: { url: '/second.png' },
    },
  },
] as Post[];

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
    useLoaderData: () => ({ blogs: mockBlogs }),
    useNavigation: () => ({ state: 'idle' }),
  };
});

import Blog from '../../src/routes/blog';

describe('Blog route', () => {
  it('renders the parity-aligned hero and all blog cards without the old CTA buttons', () => {
    render(<Blog />);

    expect(screen.getByText('Insights and updates from the OpenHands team')).toBeInTheDocument();
    expect(screen.queryByText('Try it live')).not.toBeInTheDocument();
    expect(screen.queryByText('Build with SDK')).not.toBeInTheDocument();
    expect(screen.getByText('Featured Post')).toBeInTheDocument();
    expect(screen.getByText('June 1, 2026')).toBeInTheDocument();
  });
});
