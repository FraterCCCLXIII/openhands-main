import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Whitepaper from '../../src/routes/whitepapers.modernize-legacy-systems-with-ai-agents';

const renderRoute = () => {
  render(
    <MemoryRouter>
      <Whitepaper />
    </MemoryRouter>,
  );
};

describe('modernize legacy systems whitepaper route', () => {
  it('renders the native whitepaper content', () => {
    renderRoute();

    expect(
      screen.getByRole('heading', {
        name: /Whitepaper: Modernize legacy systems before your expertise disappears/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/The Large Codebase SDK from OpenHands fills that gap/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /What you'll learn in the whitepaper:/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/How dependency-aware orchestration unlocks safe parallel refactoring/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('First Name*')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download Whitepaper' })).toBeInTheDocument();
    expect(screen.getByText(/Bring your team into the loop/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Bring your team into the loop/i })).not.toBeInTheDocument();
  });

  it('reveals the direct download CTA after a valid form submission', async () => {
    const user = userEvent.setup();
    renderRoute();

    await user.type(screen.getByLabelText('First Name*'), 'Ada');
    await user.type(screen.getByLabelText('Last Name*'), 'Lovelace');
    await user.type(screen.getByLabelText('Company Email*'), 'ada@example.com');
    await user.type(screen.getByLabelText('Role Title*'), 'Principal Engineer');
    await user.type(screen.getByLabelText('Company Name*'), 'Analytical Engines');
    await user.selectOptions(screen.getByLabelText('Engineering Team Size*'), '50-500');
    await user.click(screen.getByRole('button', { name: 'Download Whitepaper' }));

    expect(screen.getByRole('status')).toHaveTextContent('Your whitepaper is ready.');

    const downloadLink = screen.getByRole('link', { name: 'Download now' });
    expect(downloadLink).toHaveAttribute(
      'href',
      'https://cdn.prod.website-files.com/68ff4057b35616cdd47d5ac7/69d3bc19b5bb78ea951cc08c_openhands-whitepaper.pdf',
    );
    expect(screen.getByRole('link', { name: 'Talk to the team' })).toHaveAttribute('href', '/contact');
  });
});
