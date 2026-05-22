import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Pricing from '../../src/routes/pricing';

const renderPricing = () => render(
  <MemoryRouter>
    <Pricing />
  </MemoryRouter>,
);

describe('Pricing page', () => {
  it('renders the live pricing sections and plan details', () => {
    renderPricing();

    expect(screen.getByRole('heading', { name: /Pricing that fits your rollout/i })).toBeInTheDocument();

    expect(screen.getAllByText('Open Source').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Individual').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Enterprise').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Custom pricing')).toBeInTheDocument();

    expect(screen.getByText('Git integrations')).toBeInTheDocument();
    expect(screen.getByText('Priority support & shared Slack channel')).toBeInTheDocument();

    expect(screen.getAllByRole('heading', { name: /Compare plans/i })[0]).toHaveClass('sr-only');
    expect(screen.getByText('Git Integrations (GitHub, Bitbucket, GitLab)')).toBeInTheDocument();
    expect(screen.getByText('Shared Slack Channel')).toBeInTheDocument();
    expect(screen.getAllByAltText('tick icon').length).toBeGreaterThanOrEqual(10);

    expect(screen.getByRole('heading', { name: /FAQ/i })).toBeInTheDocument();
    expect(screen.getByText('What are the main differences between the pricing plans?')).toBeInTheDocument();
    // Live FAQ #1 only mentions Individual + Enterprise plans (no Growth tier).
    expect(
      screen.queryByText(/Growth Plan: Support for multiple users\./i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Enterprise plan: A self-hosted option and support for multiple users\./i),
    ).toBeInTheDocument();
    expect(screen.getByText('Can I bring my own model keys?')).toBeInTheDocument();
    expect(screen.getByText(/theOpenHands LLM provider/)).toBeInTheDocument();
    expect(screen.getByText('When you sign up for the Individual Plan, you can access models under the Settings > Language Models (LLM) page.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Contact us' }).length).toBeGreaterThan(0);
  });

  it('keeps live pricing parity semantics for plan cards and comparison sections', () => {
    const { container } = renderPricing();

    expect(screen.getByText('Everything in Free, plus:').tagName).toBe('P');
    expect(screen.getAllByText('Includes:').map((node) => node.tagName)).toEqual(['P', 'P']);
    expect(screen.getAllByText('‍').length).toBeGreaterThanOrEqual(3);

    const comparisonTable = container.querySelector('[data-wf-el="plans-compare"]');
    expect(comparisonTable).not.toBeNull();
    ['Key Capabilities', 'Integrations', 'Support'].forEach((label) => {
      const sectionLabel = within(comparisonTable as HTMLElement).getByText(label);
      expect(sectionLabel.tagName).toBe('P');
    });

    const paragraphTexts = Array.from(container.querySelectorAll('p')).map((node) =>
      node.textContent?.trim().toLowerCase(),
    );
    expect(paragraphTexts).toContain('key capabilities');
    expect(paragraphTexts).toContain('integrations');
    expect(paragraphTexts).toContain('support');
    expect(paragraphTexts).not.toContain('at cost, with no markup');

    const pricingProviderCopy = screen.getByText(/provides multiple model options/i);
    expect(pricingProviderCopy.tagName).toBe('P');
    expect(within(pricingProviderCopy).getByText('at cost, with no markup')).toHaveStyle({ color: 'rgb(0, 0, 0)' });
  });

  it('uses the live Webflow div-grid comparison structure', () => {
    const { container } = renderPricing();

    const table = container.querySelector('[data-wf-el="plans-compare"]');
    expect(table).not.toBeNull();
    expect((table as HTMLElement).style.display).toBe('grid');
    expect((table as HTMLElement).style.gap).toBe('8px');
    expect(table!.querySelectorAll('.row')[0]?.children).toHaveLength(5);
    expect(table!.querySelector('[data-wf-el="hide-on-large"]')).not.toBeNull();
    expect(table!.querySelector('[data-wf-el="pc-mobile-ctrl"]')).not.toBeNull();
    expect(table!.querySelector('[data-wf-el="select-form"]')).not.toBeNull();
    expect(table!.querySelector('table')).toBeNull();
  });

  it('does not center tick icons in comparison table (left-aligned for live parity)', () => {
    renderPricing();

    const ticks = screen.getAllByAltText('tick icon');
    ticks.forEach((tick) => {
      expect(tick.className).not.toContain('mx-auto');
    });

    const tickCell = ticks[0].closest('.col');
    expect(tickCell).not.toBeNull();
    expect(tickCell!.className).not.toContain('text-center');
  });

  it('uses two-column FAQ layout wider than 240px for the heading column', () => {
    const { container } = renderPricing();

    const faqHeading = screen.getByRole('heading', { name: /FAQ/i });
    const faqGrid = faqHeading.closest('[class*="grid"]');
    expect(faqGrid).not.toBeNull();
    expect(faqGrid!.className).not.toContain('grid-cols-[240px');
    expect(faqGrid!.className).toContain('lg:grid-cols-[493px_705.5px]');
  });

  it('renders card feature paragraphs in Webflow row/column wrappers', () => {
    const { container } = renderPricing();

    const featureRows = container.querySelectorAll('.row.row-gap-sm.row-align-center');
    expect(featureRows.length).toBeGreaterThan(0);
    featureRows.forEach((row) => {
      expect(row.querySelector('.col-shrink [data-wf-el="icon-media"]')).not.toBeNull();
      expect(row.querySelector('.col [data-wf-el="paragraph-sm"]')).not.toBeNull();
    });
  });
});
