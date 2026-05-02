import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    ).toBeInTheDocument();
    expect(screen.getByText(/The Large Codebase SDK from OpenHands fills that gap/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /What you'll learn in the whitepaper:/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/How dependency-aware orchestration unlocks safe parallel refactoring/i)).toBeInTheDocument();
    expect(screen.getByTitle('Download whitepaper form')).toBeInTheDocument();
    expect(container.querySelector('form, input, select, button')).not.toBeInTheDocument();
    expect(screen.getByText(/Bring your team into the loop/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Bring your team into the loop/i })).not.toBeInTheDocument();
  });

  it('reveals the direct download CTA after the embedded form reports success', async () => {
    renderRoute();

    fireEvent(
      window,
      new MessageEvent('message', {
        data: { type: 'openhands:whitepaper-form-submitted' },
      }),
    );

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Download the Whitepaper'));

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
