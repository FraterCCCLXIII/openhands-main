import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import statistics from '../../src/data/statistics.json';
import { Header } from '../../src/components/header';
import { PixelBlastProvider } from '../../src/contexts/pixel-blast-context';
import { HomeVariantProvider } from '../../src/contexts/home-variant-context';
import { HOME_HERO_PLATFORM_COPY, HOME_HERO_VALUE_COPY, HOME_VARIANT_STORAGE_KEY } from '../../src/constants/home-variants';
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

const selectHomeVariant = (variantId: 'v1' | 'v2' | 'v3' | 'v4') => {
  fireEvent.click(screen.getByTestId('home-variant-switcher-trigger'));
  fireEvent.click(screen.getByTestId(`home-variant-option-${variantId}`));
};

describe('home route parity structure', () => {
  beforeEach(() => {
    window.localStorage.removeItem(HOME_VARIANT_STORAGE_KEY);
  });
  it('matches the visible heading sequence expected by the parity audit', () => {
    const { container } = renderRoute();

    expect(screen.getByText('One workspace for all your AI coding agents')).toBeInTheDocument();

    const headingTexts = screen.getAllByRole('heading').map((heading) => heading.textContent?.trim());
    expect(headingTexts).not.toContain('Start with a proven workflow');
    expect(headingTexts).toContain('Fix Vulnerabilities');
    expect(headingTexts).not.toContain('SDK');
    expect(headingTexts).not.toContain('CLI');
    expect(headingTexts).toContain('Why teams choose OpenHands');
    expect(headingTexts).not.toContain('Parallel sessions, built-in automations, and a path from your laptop to your whole org.');
    expect(container.querySelector('[data-wf-el="hero-preview-lead"]')).not.toBeInTheDocument();
    expect(headingTexts).toContain('Developers love OpenHands');
    expect(headingTexts).toContain("FAQ's");

    expect(screen.queryByRole('heading', { name: 'Running in under 5 minutes.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Download Agent Canvas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Building the open standard for autonomous software development.' })).not.toBeInTheDocument();
  });

  it('uses live-like CTA and footer behavior on the homepage', () => {
    const { container } = renderRoute();

    expect(screen.getAllByTestId('workflow-card').length).toBeGreaterThan(0);
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

    expect(container.innerHTML).toContain('lovewall-marquee-rows');
    expect(container.innerHTML).not.toContain('home-hero-surfaces');
    expect(container.innerHTML).not.toContain('data-heroslide');
    expect(container.innerHTML).toContain('object-cover');
    expect(container.innerHTML).not.toContain('xl:grid-cols-4');
    expect(container.querySelectorAll('.hero-pixel-blast')).toHaveLength(4);
    expect(screen.queryAllByTestId('footer-social-link')).toHaveLength(4);
    expect(container.querySelector('main[data-testid="home-content"]')).toHaveClass('home-mobile-parity');
    expect(container.querySelector('[data-wf-el="hero-subscription"]')).toBeInTheDocument();
    expect(container.querySelector('section.text-center.text-brand-fg > [data-wf-el="container"]')).toBeInTheDocument();
  });

  it('preserves live Webflow text-node and widget parity markers', () => {
    const { container } = renderRoute();

    expect(container.querySelectorAll('[data-modal="open"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-wf-el="hero-splide_button"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-wf-el="slide-icon-media"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-wf-el="accordion-icon"] path[d^="M17 17"]')).toHaveLength(5);
    expect(container.querySelectorAll('[data-wf-el="accordion-item"][open]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-wf-el="accordion-item"][data-accordion-start-open="false"]')).toHaveLength(5);

    expect(screen.getByText('Nick Blanchet,')).toBeInTheDocument();
    expect(screen.getByText(`${Math.round(statistics.stargazers / 1000)}K`)).toBeInTheDocument();
    expect(container.textContent).toContain(`©${String.fromCharCode(160)}${new Date().getFullYear()}${String.fromCharCode(160)}OpenHands - All rights reserved`);

    expect(screen.getAllByText('@allhands_ai').length).toBeGreaterThan(0);
    expect(screen.getAllByText('@windsurf').length).toBeGreaterThan(0);
    expect(screen.getAllByText('@zeddotdev').length).toBeGreaterThan(0);
    expect(container.textContent).toContain("Built on an open source foundation, it's designed for enterprise software development at scale.");
  });

  it('renders the homepage variant switcher', () => {
    renderRoute();

    expect(screen.getByTestId('home-variant-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('home-variant-switcher-trigger')).toBeInTheDocument();
  });

  it('shows Version 1 workflow carousel above the logo grid', () => {
    const { container } = renderRoute();
    selectHomeVariant('v1');

    expect(screen.getAllByTestId('workflow-card').length).toBeGreaterThan(0);

    const preview = container.querySelector('[data-wf-el="hero-preview"]');
    const workflowCarousel = container.querySelector('[data-wf-el="hero-splide_button"]')?.closest('[data-wf-el="container"]');

    expect(container.querySelector('[data-wf-el="hero-preview-lead"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-wf-el="hero-splide_heading"]')).not.toBeInTheDocument();
    expect(workflowCarousel?.closest('[data-wf-el="hero-preview"]')).not.toBe(preview);
  });

  it('shows Version 4 workflow carousel below the hero preview when selected', () => {
    const { container } = renderRoute();
    selectHomeVariant('v4');

    expect(screen.getAllByTestId('workflow-card').length).toBeGreaterThan(0);
    expect(screen.queryAllByTestId('workflow-launch')).toHaveLength(0);
    expect(container.querySelectorAll('[data-modal="open"]')).toHaveLength(0);

    const preview = container.querySelector('[data-wf-el="hero-preview"]');
    const workflowCarousel = container.querySelector('[data-wf-el="hero-splide_button"]')?.closest('[data-wf-el="container"]');
    const appPreview = screen.getByTestId('hero-app-preview');

    expect(container.querySelector('[data-wf-el="hero-preview-lead"]')).not.toBeInTheDocument();
    expect(workflowCarousel?.closest('[data-wf-el="hero-preview"]')).toBe(preview);
    expect(appPreview.compareDocumentPosition(workflowCarousel!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('uses compact header nav links and CTA on Version 3', () => {
    renderRoute({ includeHeader: true, width: 1440 });
    selectHomeVariant('v3');

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('link', { name: 'Community' })).toHaveClass('text-sm');

    const headerCta = within(nav).getByRole('link', { name: 'Get OpenHands' });
    expect(headerCta.parentElement).toHaveStyle({ padding: '0.65em 1.35em' });
  });

  it('uses compact header nav links and CTA on Version 4', () => {
    renderRoute({ includeHeader: true, width: 1440 });
    selectHomeVariant('v4');

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('link', { name: 'Community' })).toHaveClass('text-sm');

    const headerCta = within(nav).getByRole('link', { name: 'Get OpenHands' });
    expect(headerCta.parentElement).toHaveStyle({ padding: '0.65em 1.35em' });
  });

  it('places the workflow carousel below the preview on Version 4 without a lead paragraph', () => {
    const { container } = renderRoute();
    selectHomeVariant('v4');

    expect(screen.queryByText(HOME_HERO_PLATFORM_COPY)).not.toBeInTheDocument();
    expect(screen.queryByText(HOME_HERO_VALUE_COPY)).not.toBeInTheDocument();
    expect(container.querySelector('[data-wf-el="hero-heading_paragraph"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-wf-el="hero-preview-lead"]')).not.toBeInTheDocument();

    const preview = container.querySelector('[data-wf-el="hero-preview"]');
    const appPreview = screen.getByTestId('hero-app-preview');
    const workflowCarousel = container.querySelector('[data-wf-el="hero-splide_button"]')?.closest('[data-wf-el="container"]');

    expect(workflowCarousel?.closest('[data-wf-el="hero-preview"]')).toBe(preview);
    expect(appPreview.compareDocumentPosition(workflowCarousel!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText('OpenHands works with all of your agents')).not.toBeInTheDocument();

    const heroSubscription = container.querySelector('[data-wf-el="hero-subscription"]');
    const heroButton = container.querySelector('[data-wf-el="hero_btn_wrap"]');
    expect(heroSubscription?.compareDocumentPosition(heroButton!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders workflow cards as non-interactive modules', () => {
    renderRoute();

    const cards = screen.getAllByTestId('workflow-card');
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      expect(card.tagName).toBe('ARTICLE');
      expect(card).not.toHaveAttribute('href');
      expect(card).toHaveClass('bg-[#f7f3ee]');
    });
    expect(screen.queryByRole('link', { name: /Fix Vulnerabilities/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
