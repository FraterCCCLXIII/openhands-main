import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import Pricing from '../../src/routes/pricing';
import { GitHubModalProvider } from '../../src/contexts/github-modal-context';

describe('Pricing Page', () => {
  it('renders the pricing page with correct content', () => {
    const mockOpenGitHubModal = vi.fn();
    
    render(
      <MemoryRouter>
        <GitHubModalProvider openGitHubModal={mockOpenGitHubModal}>
          <Pricing />
        </GitHubModalProvider>
      </MemoryRouter>
    );

    // Check main heading (matches Webflow design)
    expect(screen.getByText('Pricing that fits your rollout')).toBeInTheDocument();

    // Check the 4 pricing tiers
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Cloud')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
    expect(screen.getByText('Self-hosted')).toBeInTheDocument();

    // Check pricing
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('Pay-as-you-go')).toBeInTheDocument();
    expect(screen.getByText('$40 / user / month')).toBeInTheDocument();
    expect(screen.getByText('Contact us')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getAllByText('Try it live').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Contact sales').length).toBeGreaterThan(0);

    // Check Free plan features
    expect(screen.getByText('Best-in-class OpenHands Agent')).toBeInTheDocument();
    expect(screen.getByText('Web-based GUI, Terminal UI, and CLI')).toBeInTheDocument();
    expect(screen.getByText('Bring your own key or use our providers at-cost')).toBeInTheDocument();

    // Check Cloud plan features
    expect(screen.getByText('Hosted cloud access from desktop and mobile')).toBeInTheDocument();
    expect(screen.getByText('API support for automation and scripting')).toBeInTheDocument();
    expect(screen.getByText('Jira and Slack integrations')).toBeInTheDocument();
    expect(screen.getByText('BYOK or use OpenHands models at-cost')).toBeInTheDocument();

    // Check Enterprise plan features
    expect(screen.getByText('Multiple users with centralized billing')).toBeInTheDocument();
    expect(screen.getByText('At-cost, no markup pricing on LLM usage')).toBeInTheDocument();
    expect(screen.getByText('Git, Slack, and ticketing system integrations')).toBeInTheDocument();
    expect(screen.getByText('Priority support')).toBeInTheDocument();

    // Check Self-hosted plan features
    expect(screen.getByText('Run OpenHands in your private VPC')).toBeInTheDocument();
    expect(screen.getByText('Bring your own LLM key')).toBeInTheDocument();
    expect(screen.getByText('Enterprise support and services')).toBeInTheDocument();
    expect(screen.getByText('Shared Slack channel')).toBeInTheDocument();

    // Check FAQ section (matches Webflow H2)
    expect(screen.getByText("FAQ's")).toBeInTheDocument();
  });
});
