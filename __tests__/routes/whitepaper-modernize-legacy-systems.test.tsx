import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Whitepaper from '../../src/routes/whitepapers.modernize-legacy-systems-with-ai-agents';

const renderRoute = () => render(
  <MemoryRouter>
    <Whitepaper />
  </MemoryRouter>,
);

describe('modernize legacy systems whitepaper route', () => {
  it('renders the native whitepaper content with live-matching parent-page semantics', () => {
    const { container } = renderRoute();

    expect(
      screen.getByRole('heading', {
        name: /Whitepaper: Modernize legacy systems before your expertise disappears/i,
      }),
    ).toHaveClass('fluid-h1');
    expect(screen.getByText(/The Large Codebase SDK from OpenHands fills that gap/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /What you'll learn in the whitepaper:/i }),
    ).toBeInTheDocument();
    const learning = screen.getByText(/How dependency-aware orchestration unlocks safe parallel refactoring/i);
    expect(learning.tagName).toBe('LI');
    expect(learning.closest('p')).toBeNull();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Download the whitepaper to learn how it works/i,
      }),
    ).toHaveClass('fluid-h4');
    expect(container.querySelector('script[src="https://js.hsforms.net/forms/embed/50790961.js"]')).toBeInTheDocument();
    expect(container.querySelector('.hs-form-frame')).toHaveAttribute('data-region', 'na1');
    expect(container.querySelector('.hs-form-frame')).toHaveAttribute('data-portal-id', '50790961');
    expect(container.querySelector('.hs-form-frame')).toHaveAttribute('data-form-id', '4426798e-b2ea-48ec-b9ee-e314cbeda890');
    expect(container.querySelector('[data-wf-el="whitepaper_layout"]')).toBeInTheDocument();
    expect(container.querySelector('main')).toHaveStyle({ minHeight: 'calc(100vh - 84px)' });
    expect(container.querySelector('main')).not.toHaveStyle({ height: 'calc(100vh - 84px)' });

    expect(container.querySelector('[data-wf-el="card-body"]')).toBeInTheDocument();
    expect(screen.getByText(/Bring your team into the loop/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Bring your team into the loop/i })).not.toBeInTheDocument();
    expect(screen.getByText(/OpenHands - All rights reserved/i)).toBeVisible();
    expect(container.querySelectorAll('[data-wf-el="eyebrow"]')).toHaveLength(2);
  });

  it('reveals the direct download CTA after the native HubSpot form reports success', () => {
    renderRoute();

    act(() => {
      window.dispatchEvent(new Event('hs-form-event:on-submission:success'));
    });

    expect(screen.getByRole('status')).toHaveTextContent('Download the Whitepaper');

    const downloadLink = screen.getByRole('link', { name: 'Download now' });
    expect(downloadLink).toHaveAttribute(
      'href',
      '/assets/webflow/whitepapers/openhands-whitepaper.pdf',
    );
    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: /Download the whitepaper to learn how it works/i,
      }),
    ).not.toBeInTheDocument();
  });
});
