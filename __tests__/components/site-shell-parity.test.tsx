import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AnimatedHeaderLogo } from '../../src/components/animated-header-logo';
import { Footer } from '../../src/components/footer';

describe('site shell parity helpers', () => {
  it('renders a decorative header logo image', () => {
    const { container } = render(<AnimatedHeaderLogo />);

    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('hides social links in the standalone footer by default', () => {
    render(
      <MemoryRouter>
        <Footer standalone />
      </MemoryRouter>
    );

    expect(screen.queryAllByTestId('footer-social-link')).toHaveLength(0);
  });

  it('can render the compact Webflow-style footer navigation', () => {
    const { container } = render(
      <MemoryRouter>
        <Footer standalone compactNav />
      </MemoryRouter>
    );

    expect(container.querySelector('#footer-resources')?.parentElement).toHaveClass('justify-between');
    expect(screen.getByRole('link', { name: 'About' })).toHaveClass('py-[14.4px]');
    expect(container.textContent).toContain(`©${String.fromCharCode(160)}${new Date().getFullYear()}${String.fromCharCode(160)}OpenHands - All rights reserved`);
  });
});
