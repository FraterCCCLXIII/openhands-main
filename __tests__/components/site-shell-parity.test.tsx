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

  it('shows social links in the standalone footer', () => {
    render(
      <MemoryRouter>
        <Footer standalone />
      </MemoryRouter>
    );

    expect(screen.getAllByTestId('footer-social-link')).toHaveLength(3);
  });
});
