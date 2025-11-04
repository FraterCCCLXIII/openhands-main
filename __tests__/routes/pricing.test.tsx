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

    // Check main heading
    expect(screen.getByText('OpenHands Cloud Pricing')).toBeInTheDocument();

    // Check the 3 pricing tiers
    expect(screen.getByText('Individual')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Cloud')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Self-hosted')).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText('Great for individual developers')).toBeInTheDocument();
    expect(screen.getByText('For teams and organizations')).toBeInTheDocument();
    expect(screen.getByText('Everything in Enterprise Cloud, plus:')).toBeInTheDocument();
    
    // Check pricing
    expect(screen.getByText('Free to start')).toBeInTheDocument();
    expect(screen.getByText('$40 / user / month')).toBeInTheDocument();
    expect(screen.getAllByText('Contact Us').length).toBeGreaterThan(0);

    // Check buttons
    expect(screen.getByText('Start with OSS')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByText('Join Early Access')).toBeInTheDocument();
    expect(screen.getAllByText('Contact Us').length).toBeGreaterThan(0);

    // Check Individual plan features
    expect(screen.getByText('1 user')).toBeInTheDocument();
    expect(screen.getByText('Access from desktop or mobile')).toBeInTheDocument();
    expect(screen.getByText('Bring your own LLM, or use OpenHands LLMs at cost')).toBeInTheDocument();
    expect(screen.getByText('High token rate limits')).toBeInTheDocument();
    expect(screen.getByText('GitHub, GitLab, and Bitbucket')).toBeInTheDocument();
    expect(screen.getAllByText('API support').length).toBeGreaterThan(0);

    // Check Enterprise Cloud features
    expect(screen.getByText('Multiple users')).toBeInTheDocument();
    expect(screen.getByText('Centralized billing')).toBeInTheDocument();
    expect(screen.getByText('At-cost, no markup pricing on LLM usage')).toBeInTheDocument();
    expect(screen.getByText('Model choice (or bring your own LLM)')).toBeInTheDocument();
    expect(screen.getByText('Git, Slack, and ticketing system integrations')).toBeInTheDocument();
    expect(screen.getByText('Priority support')).toBeInTheDocument();

    // Check Enterprise Self-hosted features
    expect(screen.getByText('Run OpenHands Cloud in your private VPC')).toBeInTheDocument();
    expect(screen.getByText('Bring your own LLM key')).toBeInTheDocument();
    expect(screen.getByText('Enterprise support and services')).toBeInTheDocument();
    expect(screen.getByText('Shared Slack channel')).toBeInTheDocument();

    // Check local OpenHands section
    expect(screen.getByText('Want to try OpenHands locally?')).toBeInTheDocument();

    // Check FAQ section
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });
});
