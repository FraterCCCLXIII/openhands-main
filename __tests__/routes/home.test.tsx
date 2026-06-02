import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import statistics from '../../src/data/statistics.json';
import { Header } from '../../src/components/header';
import { PixelBlastProvider } from '../../src/contexts/pixel-blast-context';
import { HomeVariantProvider } from '../../src/contexts/home-variant-context';
import { HOME_VARIANT_STORAGE_KEY } from '../../src/constants/home-variants';
import Home from '../../src/routes/home';

const renderRoute = ({ includeHeader = false, width = 1440 }: { includeHeader?: boolean; width?: number } = {}) => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <HomeVariantProvider>
        <PixelBlastProvider>
          {includeHeader ? <Header width={width} showMenuIcon onClickMenuButton={() => {}} /> : null}
          <Home />
        </PixelBlastProvider>
      </HomeVariantProvider>
    </MemoryRouter>,
  );
};

const selectHomeVariant = (variantId: 'v1' | 'v2') => {
  fireEvent.click(screen.getByTestId('home-variant-switcher-trigger'));
  fireEvent.click(screen.getByTestId(`home-variant-option-${variantId}`));
};

describe('home route parity structure', () => {
  beforeEach(() => {
    window.localStorage.removeItem(HOME_VARIANT_STORAGE_KEY);
  });
  it('matches the visible heading sequence expected by the parity audit', () => {
    renderRoute();

    expect(screen.getByText('One workspace for all your AI coding agents')).toBeInTheDocument();

    const headingTexts = screen.getAllByRole('heading').map((heading) => heading.textContent?.trim());
    expect(headingTexts).not.toContain('Start with a proven workflow');
    expect(headingTexts).not.toContain('Fix Vulnerabilities');
    expect(headingTexts).not.toContain('SDK');
    expect(headingTexts).not.toContain('CLI');
    expect(headingTexts).toContain('Why teams choose OpenHands');
    expect(headingTexts).toContain('Automate the Outer Loop with AI');
    expect(headingTexts).toContain('Developers love OpenHands');
    expect(headingTexts).toContain("FAQ's");

    expect(screen.queryByRole('heading', { name: 'Running in under 5 minutes.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Download Agent Canvas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Building the open standard for autonomous software development.' })).not.toBeInTheDocument();
  });

  it('uses live-like CTA and footer behavior on the homepage', () => {
    const { container } = renderRoute();

    expect(screen.queryAllByTestId('workflow-launch')).toHaveLength(0);
    expect(screen.queryByText('Launch')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Download CLI' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'See all use cases' })).not.toBeInTheDocument();
    const installLinks = screen.getAllByRole('link', { name: 'Get OpenHands' });
    expect(installLinks[0]).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/overview/quickstart',
    );
    expect(screen.getByText('OpenHands works with all of your agents')).toBeInTheDocument();
    expect(screen.getByText('Trusted by engineers at')).toBeInTheDocument();
    expect(screen.getByText('Claude Code')).toBeInTheDocument();
    expect(screen.getByTestId('hero-app-preview')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'OpenHands Agent Canvas home with conversations' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-wf-el="hero-preview-slide"]')).toHaveLength(6);
    expect(screen.queryByRole('link', { name: 'Build with SDK' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Get OpenHands' }).length).toBeGreaterThan(0);

    expect(container.innerHTML).toContain('lg:grid-cols-3');
    expect(container.innerHTML).not.toContain('home-hero-surfaces');
    expect(container.innerHTML).not.toContain('data-heroslide');
    expect(container.innerHTML).toContain('object-cover');
    expect(container.innerHTML).not.toContain('xl:grid-cols-4');
    expect(container.querySelectorAll('.hero-pixel-blast')).toHaveLength(4);
    expect(screen.queryAllByTestId('footer-social-link')).toHaveLength(3);
    expect(container.querySelector('main[data-testid="home-content"]')).toHaveClass('home-mobile-parity');
    expect(container.querySelector('[data-wf-el="hero-subscription"]')).toBeInTheDocument();
    expect(container.querySelector('section.text-center.text-brand-fg > [data-wf-el="container"]')).toBeInTheDocument();
  });

  it('preserves live Webflow text-node and widget parity markers', () => {
    const { container } = renderRoute();

    expect(container.querySelectorAll('[data-modal="open"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-wf-el="hero-splide_button"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-wf-el="slide-icon-media"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-wf-el="accordion-icon"] path[d^="M17 17"]')).toHaveLength(5);
    expect(container.querySelectorAll('[data-wf-el="accordion-item"][open]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-wf-el="accordion-item"][data-accordion-start-open="false"]')).toHaveLength(5);

    expect(screen.getByText('Nick Blanchet,')).toBeInTheDocument();
    expect(screen.getByText(`${Math.round(statistics.stargazers / 1000)}K`)).toBeInTheDocument();
    expect(container.textContent).toContain(`©${String.fromCharCode(160)}${new Date().getFullYear()}${String.fromCharCode(160)}OpenHands - All rights reserved`);

    expect(screen.getByText('@allhands_ai')).toBeInTheDocument();
    expect(screen.getByText('@windsurf')).toBeInTheDocument();
    expect(screen.getByText('@zeddotdev')).toBeInTheDocument();
    expect(container.textContent).toContain("Built on an open source foundation, it's designed for enterprise software development at scale.");
  });

  it('renders the homepage variant switcher', () => {
    renderRoute();

    expect(screen.getByTestId('home-variant-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('home-variant-switcher-trigger')).toBeInTheDocument();
  });

  it('shows Version 1 workflow carousel when selected', () => {
    renderRoute();
    selectHomeVariant('v1');

    expect(screen.getByRole('heading', { name: 'Start with a proven workflow' })).toBeInTheDocument();
    expect(screen.getAllByTestId('workflow-launch').length).toBeGreaterThan(0);
  });

  it('uses compact header nav links and CTA on Version 3', () => {
    renderRoute({ includeHeader: true, width: 1440 });
    selectHomeVariant('v3');

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('link', { name: 'Community' })).toHaveClass('text-sm');

    const headerCta = within(nav).getByRole('link', { name: 'Get OpenHands' });
    expect(headerCta.parentElement).toHaveStyle({ padding: '0.65em 1.35em' });
  });

  it.skip('opens a live-like workflow launch dialog instead of navigating directly', () => {
    const { container } = renderRoute();
    selectHomeVariant('v1');
    const [firstLaunch] = screen.getAllByTestId('workflow-launch');

    expect(firstLaunch).toHaveAttribute(
      'data-sdk-url',
      'https://github.com/OpenHands/extensions/tree/main/plugins/vulnerability-remediation',
    );
    expect(firstLaunch).toHaveAttribute('data-cloud-url', '');

    fireEvent.click(firstLaunch);

    const dialog = container.querySelector('dialog[data-modal="modal"]');
    expect(dialog).toHaveClass('dialog');
    expect(dialog).toHaveAttribute('open');
    expect(container.querySelector('.dialog_top_wrap')).toBeInTheDocument();
    expect(container.querySelector('.dialog_bottom_wrap')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Launch in Cloud' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Launch in Cloud' })).toHaveAttribute(
      'href',
      'https://app.all-hands.dev/login',
    );
    expect(screen.getByRole('link', { name: 'Get SDK Example' })).toHaveAttribute(
      'href',
      'https://github.com/OpenHands/extensions/tree/main/plugins/vulnerability-remediation',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close workflow dialog' }));
    expect(dialog).not.toHaveAttribute('open');
  });
});
