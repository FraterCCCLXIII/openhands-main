import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Product from '../../src/routes/product';
import Enterprise from '../../src/routes/enterprise';
import Community from '../../src/routes/community';

const renderRoute = (node: React.ReactNode) => {
  render(<MemoryRouter>{node}</MemoryRouter>);
};

describe('Marketing parity routes', () => {
  it('renders the updated product page content', () => {
    renderRoute(<Product />);

    expect(screen.getByRole('heading', { name: /Build better software with autonomous cloud agent/i })).toBeInTheDocument();
    expect(screen.getByText('Join Slack')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Terminal / CLI' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Web GUI' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SDK' })).toBeInTheDocument();
    expect(screen.getAllByText('Learn more')).toHaveLength(3);
    expect(
      screen.getByRole('heading', {
        name: /The only open, secure, and scalable agent platform built for real engineering work/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Coding Agent SDK')).toBeInTheDocument();
  });

  it('renders the updated enterprise page content', () => {
    renderRoute(<Enterprise />);

    expect(screen.getByRole('heading', { name: /Enterprise control meets open-source innovation/i })).toBeInTheDocument();
    expect(screen.getByText('Trust Center')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Why Enterprises Choose OpenHands/i })).toBeInTheDocument();
    expect(screen.getByText('Dedicated technical and account-level support')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Powering enterprise AI with the world’s best/i })).toBeInTheDocument();
    expect(screen.getByText('Measured impact')).toBeInTheDocument();
    expect(screen.getByText('Download the Whitepaper')).toBeInTheDocument();
  });

  it('renders the updated community page content', () => {
    renderRoute(<Community />);

    expect(screen.getByText('Get started with OpenHands Open Source')).toBeInTheDocument();
    expect(screen.getByText('Download CLI')).toBeInTheDocument();
    expect(screen.getByText('Download Web UI')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Join the OpenHands Community/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Latest Community Call/i })).toBeInTheDocument();
    expect(screen.getByText('April 28, 2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Upcoming Events/i })).toBeInTheDocument();
    expect(screen.getByText('Scale Enterprise AI Agents')).toBeInTheDocument();
    expect(screen.getByText('OpenHands Community Call - May 21st')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Community contributor spotlight/i })).toBeInTheDocument();
    expect(screen.getByText(/My team uses OpenHands for all our development tasks/i)).toBeInTheDocument();
  });
});
