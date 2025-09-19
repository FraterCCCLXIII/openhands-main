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

    // Check toggle buttons
    expect(screen.getByText('Individual Plans')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Plans')).toBeInTheDocument();

    // Check individual pricing tiers
    expect(screen.getByText('Pay-as-you-go')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText('Great for getting started')).toBeInTheDocument();
    expect(screen.getByText('Everything in Pay-as-you-go, plus:')).toBeInTheDocument();
    
    // Check free credits amount
    expect(screen.getByText('$20 in free credits')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Start with OSS')).toBeInTheDocument();
    expect(screen.getAllByText('Sign Up').length).toBeGreaterThan(0);

    // Check Pay-as-you-go features
    expect(screen.getByText('1 user')).toBeInTheDocument();
    expect(screen.getByText('Access from desktop or mobile')).toBeInTheDocument();
    expect(screen.getByText('Access to highest-performing LLMs')).toBeInTheDocument();
    expect(screen.getByText('High token rate limits')).toBeInTheDocument();
    expect(screen.getByText('GitHub, GitLab, and Bitbucket')).toBeInTheDocument();
    expect(screen.getByText('API support')).toBeInTheDocument();
    expect(screen.getByText('Marked up pricing on LLM usage')).toBeInTheDocument();

    // Check Pro features
    expect(screen.getByText('$20 / month')).toBeInTheDocument();
    expect(screen.getByText('At-cost, no markup pricing on LLM usage')).toBeInTheDocument();
    expect(screen.getByText('Model choice (or bring your own LLM)')).toBeInTheDocument();
    expect(screen.getByText('Access to OpenHands runtime compute')).toBeInTheDocument();
    expect(screen.getByText('LLM risk analyzer')).toBeInTheDocument();

    // Check local OpenHands section
    expect(screen.getByText('Want to try OpenHands locally?')).toBeInTheDocument();

    // Check FAQ section
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });
});
