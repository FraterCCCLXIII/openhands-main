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

    expect(screen.getByRole('heading', { name: /Compare plans/i })).toBeInTheDocument();
    expect(screen.getByText('Git Integrations (GitHub, Bitbucket, GitLab)')).toBeInTheDocument();
    expect(screen.getByText('Shared Slack Channel')).toBeInTheDocument();
    expect(screen.getAllByAltText('tick icon').length).toBeGreaterThanOrEqual(30);

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

    const comparisonTable = screen.getByRole('table');
    ['Key Capabilities', 'Integrations', 'Support'].forEach((label) => {
      const sectionLabel = within(comparisonTable).getByText(label);
      expect(sectionLabel.tagName).toBe('P');
    });

    const paragraphTexts = Array.from(container.querySelectorAll('p')).map((node) =>
      node.textContent?.trim().toLowerCase(),
    );
    expect(paragraphTexts).toContain('key capabilities');
    expect(paragraphTexts).toContain('integrations');
    expect(paragraphTexts).toContain('support');
    expect(paragraphTexts).not.toContain('at cost, with no markup');
  });

  it('uses table-layout: fixed with constrained column widths for comparison table', () => {
    const { container } = renderPricing();

    const table = container.querySelector('table');
    expect(table).not.toBeNull();
    expect(table!.style.tableLayout).toBe('fixed');

    const cols = table!.querySelectorAll('colgroup col');
    expect(cols).toHaveLength(4);
    const widths = Array.from(cols).map((col) => (col as HTMLElement).style.width);
    expect(widths[0]).toBe('28%');
    expect(widths[1]).toBe('24%');
    expect(widths[2]).toBe('24%');
    expect(widths[3]).toBe('24%');
  });

  it('does not center tick icons in comparison table (left-aligned for live parity)', () => {
    renderPricing();

    const ticks = screen.getAllByAltText('tick icon');
    ticks.forEach((tick) => {
      expect(tick.className).not.toContain('mx-auto');
    });

    const tickCell = ticks[0].closest('td');
    expect(tickCell).not.toBeNull();
    expect(tickCell!.className).not.toContain('text-center');
  });

  it('uses two-column FAQ layout wider than 240px for the heading column', () => {
    const { container } = renderPricing();

    const faqHeading = screen.getByRole('heading', { name: /FAQ/i });
    const faqGrid = faqHeading.closest('[class*="grid"]');
    expect(faqGrid).not.toBeNull();
    expect(faqGrid!.className).not.toContain('grid-cols-[240px');
    expect(faqGrid!.className).toContain('grid-cols-[minmax(0,2fr)_minmax(0,3fr)]');
  });

  it('renders card feature paragraphs with flex-1 for full-width layout', () => {
    const { container } = renderPricing();

    const featureListItems = container.querySelectorAll('ul li p');
    expect(featureListItems.length).toBeGreaterThan(0);
    featureListItems.forEach((p) => {
      expect(p.className).toContain('flex-1');
    });
  });
});
