import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { BlogFooter } from '../../src/components/blog-footer';
import { GitHubModal } from '../../src/components/github-modal';
import About from '../../src/routes/about';

describe('shared branding links', () => {
  it('points the about page careers CTA to the current jobs page', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Join us' })).toHaveAttribute(
      'href',
      'https://jobs.ashbyhq.com/OpenHands'
    );
  });

  it('uses current docs destinations in the github modal', () => {
    render(<GitHubModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'Download Web UI' })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup#start-the-app'
    );
    expect(screen.getByRole('link', { name: 'Download CLI' })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/run-openhands/cli-mode#getting-started'
    );
  });

  it('uses OpenHands branding in the blog footer copy and citation', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <BlogFooter
              title='Test Post'
              authors={[{ name: 'Jane Doe' }]}
              date='2026-01-02'
              url='https://openhands.dev/blog/test-post'
            />
          ),
        },
      ],
      { initialEntries: ['/'] }
    );

    render(<RouterProvider router={router} />);

    expect(
      screen.getByText('Sign up for our newsletter for updates, events, and community insights.')
    ).toBeInTheDocument();

    expect(screen.getByTitle('Collapse Citation')).toBeInTheDocument();
    expect(screen.getByText(/organization = \{OpenHands Blog\}/)).toBeInTheDocument();
  });
});
