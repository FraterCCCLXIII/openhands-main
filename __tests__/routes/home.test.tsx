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

    expect(screen.getByText('Build with coding agents, your way.')).toBeInTheDocument();

    const headingTexts = screen.getAllByRole('heading').map((heading) => heading.textContent?.trim());
    expect(headingTexts).toContain('Start with a proven workflow');
    expect(headingTexts).toContain('Fix Vulnerabilities');
    expect(headingTexts).toContain('SDK');
    expect(headingTexts).toContain('Why teams choose OpenHands');
    expect(headingTexts).toContain('Automate the Outer Loop with AI');
    expect(headingTexts).toContain('Developers love OpenHands');
    expect(headingTexts).toContain("FAQ's");

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
    expect(container.querySelectorAll('[data-key]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-heroslide]')).toHaveLength(3);
    expect(container.innerHTML).toContain('min-height: 792px');
    expect(container.innerHTML).toContain('h-full w-full object-cover');
    expect(container.innerHTML).not.toContain('xl:grid-cols-4');
    expect(screen.getByRole('img', { name: 'ASCII art depicting a large black hole with light and particles swirling around it.' })).toHaveClass(
      'h-full',
      'w-full',
      'object-cover',
    );
    expect(screen.queryAllByTestId('footer-social-link')).toHaveLength(3);
  });
});
