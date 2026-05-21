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

    expect(container.querySelector('section[data-wf-el="section"]')).toHaveStyle({
      padding: 'var(--footer-section-padding, var(--section-padding-y)) 0px',
      height: 'var(--footer-section-height, auto)',
    });
    expect(container.querySelector('section[data-wf-el="section"]')).toHaveClass('section', 'u-bg-primary', 'footer-webflow-layout');
    expect(container.querySelector('[data-wf-el="container"]')).toHaveStyle({
      width: 'var(--footer-container-width, 90%)',
      height: 'var(--footer-container-height, auto)',
    });
    expect(container.querySelector('[data-wf-el="paragraph-lg"]')).toHaveStyle({
      fontSize: 'var(--footer-paragraph-lg-font-size, var(--paragraph-lg-font-size))',
      lineHeight: 'var(--footer-paragraph-lg-line-height, 1.2)',
    });
    expect(container.querySelector('.section-title')).toHaveStyle({ marginBottom: '22px' });
    expect(container.querySelector('#footer-resources')?.parentElement).toHaveClass('justify-between');
    expect(container.querySelector('#footer-resources')).toHaveClass('footer-drop');
    expect(screen.getByRole('link', { name: 'About' })).toHaveClass('py-[14.4px]');
    expect(container.querySelector('.footer-logo-img')).toHaveStyle({
      width: 'var(--footer-logo-width, 610px)',
      height: 'var(--footer-logo-height, 102px)',
    });
    expect(container.textContent).toContain(`©${String.fromCharCode(160)}${new Date().getFullYear()}${String.fromCharCode(160)}OpenHands - All rights reserved`);
  });
});
