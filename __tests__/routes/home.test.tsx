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
      'Triage Incidents',
      'See all use cases',
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

    expect(screen.getAllByTestId('workflow-launch')).toHaveLength(4);
    expect((container.innerHTML.match(/>Launch</g) ?? []).length).toBe(4);
    expect(screen.queryByRole('link', { name: 'Download CLI' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View docs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Talk to us' })).toBeInTheDocument();

    expect(container.innerHTML).toContain('lg:grid-cols-3');
    expect(container.innerHTML).toContain('lg:translate-y-[68px]');
    expect(container.innerHTML).toContain('whitespace-nowrap text-[32px]');
    expect(container.innerHTML).toContain('lg:-translate-y-[58px]');
    expect(container.innerHTML).toContain('mt-[145px]');
    expect(container.innerHTML).toContain('lg:pt-[114px]');
    expect(container.innerHTML).toContain('margin-top: 233px');
    expect(container.innerHTML).toContain('relative h-[800px] overflow-hidden bg-brand-accent');
    expect(container.innerHTML).toContain('absolute inset-0 h-full w-full object-cover');
    expect(container.innerHTML).toContain('lg:pb-[191px]');
    expect(container.innerHTML).not.toContain('xl:grid-cols-4');
    expect(screen.getByRole('img', { name: 'ASCII art depicting a large black hole with light and particles swirling around it.' })).toHaveClass(
      'h-full',
      'w-full',
      'object-cover',
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('text-[#8a5f45]');
    expect(screen.getAllByTestId('footer-social-link')).toHaveLength(3);
  });
});
