import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import Pricing from '../../src/routes/pricing';

describe('Pricing Page', () => {
  it('renders the pricing page with correct content', () => {
    render(
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>
    );

    // Check main heading
    expect(screen.getByText('Flexible Pricing')).toBeInTheDocument();

    // Check pricing tiers
    expect(screen.getByText('Open Source')).toBeInTheDocument();
    expect(screen.getByText('Individual')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();

    // Check descriptions
    expect(
      screen.getByText("The world's leading open source AI coding agent")
    ).toBeInTheDocument();
    expect(screen.getByText('Great for individuals')).toBeInTheDocument();
    expect(
      screen.getByText('Great for teams')
    ).toBeInTheDocument();
    
    // Check free credits amount
    expect(screen.getByText('Start with $20 in free credits')).toBeInTheDocument();

    // Check OpenHands Cloud banner
    expect(screen.getByText('OpenHands Cloud')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Get it on GitHub')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();

    // Check Open Source features
    expect(screen.getByText('Run OpenHands locally')).toBeInTheDocument();
    expect(
      screen.getByText('Bring your own LLM or API key')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Active open source community')
    ).toBeInTheDocument();

    // Check Individual (formerly Pay-as-you-go) features
    expect(screen.getByText('1 user')).toBeInTheDocument();
    expect(screen.getByText('Pay-as-you-go ($10 min refill)')).toBeInTheDocument();
    expect(screen.getByText('Access from desktop or mobile')).toBeInTheDocument();
    expect(
      screen.getByText('Access to the highest-performing LLMs')
    ).toBeInTheDocument();
    expect(screen.getByText('High token rate limits')).toBeInTheDocument();
    expect(screen.getByText('Use with GitHub or GitLab')).toBeInTheDocument();
    expect(screen.getAllByText('API support').length).toBeGreaterThan(0);

    expect(screen.getByText('Multiple users')).toBeInTheDocument();
    expect(screen.getByText('Additional integrations')).toBeInTheDocument();
    expect(screen.getByText('Higher token rate limits')).toBeInTheDocument();
    expect(
      screen.getByText('More concurrent conversations')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Bring your own LLM (self-hosted only)')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Support and enablement package')
    ).toBeInTheDocument();
  });
});
