import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Pricing from '../../src/routes/pricing';

describe('Pricing page', () => {
  it('renders the live pricing sections and plan details', () => {
    render(
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>,
    );

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
    expect(screen.getByText('Growth Plan: Support for multiple users. Great for small organizations who want the on-demand convenience of OpenHands Cloud and additional support.')).toBeInTheDocument();
    expect(screen.getByText('Can I bring my own model keys?')).toBeInTheDocument();
    expect(screen.getByText(/At cost, with no markup\./i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Contact us' }).length).toBeGreaterThan(0);
  });
});
