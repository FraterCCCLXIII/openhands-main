import type { ReactNode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AnimatedHeaderLogo } from '../../src/components/animated-header-logo';
import { Footer } from '../../src/components/footer';
import { Header } from '../../src/components/header';
import { Sidebar } from '../../src/components/sidebar/sidebar';
import { PixelBlastProvider } from '../../src/contexts/pixel-blast-context';

const renderWithProviders = (node: ReactNode) =>
  render(<PixelBlastProvider><MemoryRouter>{node}</MemoryRouter></PixelBlastProvider>);

describe('site shell parity helpers', () => {
  it('renders a decorative header logo image', () => {
    const { container } = render(<AnimatedHeaderLogo />);

    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('hides social links in the standalone footer by default', () => {
    renderWithProviders(<Footer standalone />);

    expect(screen.queryAllByTestId('footer-social-link')).toHaveLength(0);
  });

  it('can render the compact Webflow-style footer navigation', () => {
    const { container } = renderWithProviders(<Footer standalone compactNav />);

    expect(container.querySelector('section[data-wf-el="section"]')).toHaveStyle({
      padding: '80px 0px',
      height: 'auto',
    });
    expect(container.querySelector('section[data-wf-el="section"]')).toHaveClass('section', 'u-bg-primary', 'footer-webflow-layout');
    expect(container.querySelector('[data-wf-el="container"]')).toHaveStyle({
      marginTop: '49.6px',
    });
    expect(container.querySelector('.fluid-body-lg')).toBeInTheDocument();
    expect(container.querySelector('.section-title')).toHaveStyle({ marginBottom: '22px' });
    expect(container.querySelector('[data-wf-el="footer-legal-row"]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
    expect(container.querySelector('.footer-logo-img')).toHaveStyle({
      width: 'var(--footer-logo-width, 610px)',
      height: 'var(--footer-logo-height, 102px)',
    });
    expect(container.textContent).toContain(`©${String.fromCharCode(160)}${new Date().getFullYear()}${String.fromCharCode(160)}OpenHands - All rights reserved`);
  });


  it('drives manifesto footer structure from props instead of the current route', () => {
    const { container } = renderWithProviders(<Footer standalone compactNav layoutVariant='manifesto' />);

    expect(container.querySelector('section[data-wf-el="section"]')).toHaveStyle({
      padding: '80px 0px',
      height: '1209.38px',
    });
    expect(container.querySelector('.container.u-position-relative')).toHaveStyle({
      width: 'var(--footer-container-width, 90%)',
      height: '950.1875px',
    });
    expect(container.querySelector('[data-wf-el="footer-legal-row"]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
  });

  it('renders the live-style compact close state in the header', () => {
    const { container } = render(
      <MemoryRouter>
        <Header width={375} showMenuIcon={false} onClickMenuButton={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Close Menu' })).toHaveClass('is-open');
    expect(container.querySelector('[data-wf-el="nav_wrap"]')).toHaveClass('is-menu-open');
    expect(container.querySelector('[data-wf-el="mobile_menu"]')).not.toBeInTheDocument();
  });

  it('uses the live compact header from the medium breakpoint', () => {
    const { container } = render(
      <MemoryRouter>
        <Header width={768} showMenuIcon onClickMenuButton={() => {}} />
      </MemoryRouter>
    );

    expect(container.querySelector('[data-wf-el="nav_wrap"]')).toHaveStyle({ height: '83.578125px' });
    expect(container.querySelector('[data-wf-el="nav_grid"]')).toHaveStyle({ display: 'none' });
    expect(container.querySelector('.compact-nav')).toHaveStyle({ display: 'flex' });
    expect(screen.getByRole('button', { name: 'Open Menu' })).toHaveTextContent('Menu');
    expect(screen.getByRole('link', { name: 'Get OpenHands' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Try it live' })).not.toBeInTheDocument();
    expect(container.querySelector('[data-wf-el="mobile_menu"]')).not.toBeInTheDocument();
  });

  it('renders the compact sidebar as the live full-screen menu overlay', () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar isHidden={false} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(container.querySelector('[data-testid="sidebar"]')).toHaveClass('fixed', 'inset-0', 'w-screen');
    const productButton = screen.getByRole('button', { name: 'Product' });
    expect(productButton).toHaveAttribute('aria-expanded', 'false');
    expect(productButton).toHaveClass('justify-start', 'gap-2');
    expect(productButton).not.toHaveClass('justify-between');
  });


  it('keeps the outer footer container marker while suppressing the inner nav container marker', () => {
    const { container } = renderWithProviders(<Footer compactNav containerWfEl={null} />);

    expect(container.querySelectorAll('[data-wf-el="container"]')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
  });

  describe('homepage nav Get OpenHands CTA', () => {
    let heroElement: HTMLDivElement;

    beforeEach(() => {
      heroElement = document.createElement('div');
      heroElement.setAttribute('data-wf-el', 'hero-top');
      heroElement.style.height = '600px';
      document.body.appendChild(heroElement);
      heroElement.getBoundingClientRect = () =>
        ({
          bottom: 400,
          top: 0,
          left: 0,
          right: 0,
          width: 1200,
          height: 600,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('uses secondary outline styling on the homepage until the hero scrolls away', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header width={1440} showMenuIcon onClickMenuButton={() => {}} />
        </MemoryRouter>,
      );

      const cta = screen.getByRole('link', { name: 'Get OpenHands' }).closest('.nav-header-cta');
      expect(cta).toHaveStyle({ '--nav-cta-blend': '0' });

      heroElement.getBoundingClientRect = () =>
        ({
          bottom: -120,
          top: -720,
          left: 0,
          right: 0,
          width: 1200,
          height: 600,
          x: 0,
          y: -720,
          toJSON: () => ({}),
        }) as DOMRect;

      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      expect(screen.getByRole('link', { name: 'Get OpenHands' }).closest('.nav-header-cta')).toHaveStyle({
        '--nav-cta-blend': '1',
      });
    });

    it('keeps primary styling on non-home routes', () => {
      render(
        <MemoryRouter initialEntries={['/about']}>
          <Header width={1440} showMenuIcon onClickMenuButton={() => {}} />
        </MemoryRouter>,
      );

      expect(screen.getByRole('link', { name: 'Get OpenHands' }).closest('.nav-header-cta')).toHaveStyle({
        '--nav-cta-blend': '1',
      });
    });
  });
});
