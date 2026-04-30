import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Home from '../../src/routes/home';

const renderRoute = () => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>,
  );
};

describe('home route parity structure', () => {
  it('matches the visible heading sequence expected by the parity audit', () => {
    renderRoute();

    expect(screen.queryByRole('heading', { level: 1, name: 'Build with coding agents, your way.' })).not.toBeInTheDocument();

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent?.trim())).toEqual([
      'Start with a proven workflow',
      'Fix Vulnerabilities',
      'Review PRs',
      'Migrate Code',
      'SDK',
      'Why teams choose OpenHands',
      'Automate the Outer Loop with AI',
      'Developers love OpenHands',
      "FAQ's",
    ]);

    expect(screen.queryByRole('heading', { name: 'Cloud' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'CLI' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Building the open standard for autonomous software development.' })).not.toBeInTheDocument();
  });

  it('uses live-like CTA and footer behavior on the homepage', () => {
    const { container } = renderRoute();

    expect(screen.getAllByTestId('workflow-launch')).toHaveLength(3);
    expect((container.innerHTML.match(/>Launch</g) ?? []).length).toBe(3);
    expect(screen.queryByRole('link', { name: 'Download CLI' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View docs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Talk to us' })).not.toBeInTheDocument();

    expect(container.innerHTML).toContain('lg:grid-cols-3');
    expect(container.innerHTML).not.toContain('xl:grid-cols-4');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('text-[#8a5f45]');
    expect(screen.getAllByTestId('footer-social-link')).toHaveLength(3);
  });
});
