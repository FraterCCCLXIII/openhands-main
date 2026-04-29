import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Product from '../../src/routes/product';
import ProductCli from '../../src/routes/product-cli';
import ProductGui from '../../src/routes/product-gui';
import ProductSdk from '../../src/routes/product-sdk';
import Enterprise from '../../src/routes/enterprise';
import Community from '../../src/routes/community';

const renderRoute = (node: React.ReactNode) => {
  return render(<MemoryRouter>{node}</MemoryRouter>);
};

const FAQ_LABEL_COUNT = 5;

describe('Marketing parity routes', () => {
  it('renders the updated product page content', () => {
    renderRoute(<Product />);

    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Build better software with autonomous cloud agent/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Terminal / CLI' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Web GUI' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SDK' })).toBeInTheDocument();
    expect(screen.getAllByText('Learn more')).toHaveLength(3);
    expect(screen.getAllByRole('link', { name: 'Learn more' }).map((link) => link.getAttribute('href'))).toEqual([
      '/product/cli',
      '/product/gui',
      '/product/sdk',
    ]);
    expect(screen.getByRole('link', { name: 'Join Slack' })).toHaveAttribute('href', 'https://app.all-hands.dev/');
    expect(screen.getByText('Coding Agent SDK')).toBeInTheDocument();
    expect(screen.getByText(/Building the open standard for autonomous software development/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: /Building the open standard for autonomous software development/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the CLI product page content', () => {
    const { container } = renderRoute(<ProductCli />);

    expect(screen.getByText('Terminal / CLI')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Agentic power from the command line/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /A first-class terminal and CLI interface for autonomous agents/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join Slack' })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/cli/installation',
    );
    expect(screen.getByText('Intuitive and powerful Terminal UX')).toBeInTheDocument();
    expect(screen.getByText('Fix bugs before standup')).toBeInTheDocument();
    expect(screen.getByText('Does the OpenHands CLI require cloud connectivity?')).toBeInTheDocument();
    expect(container.querySelectorAll('summary label')).toHaveLength(FAQ_LABEL_COUNT);
    expect(
      screen.queryByRole('heading', { name: /Control your agents like real infrastructure/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the GUI product page content', () => {
    renderRoute(<ProductGui />);

    expect(screen.getByRole('heading', { name: /Agentic development, made human/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join Slack' })).toHaveAttribute('href', 'https://app.all-hands.dev/');
    expect(screen.getByText('Generate technical plans and PRDs')).toBeInTheDocument();
    expect(screen.getByText('Break epics into agent-sized tasks')).toBeInTheDocument();
    expect(screen.getByText('What is the OpenHands GUI?')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Bring your team into the loop/i })).not.toBeInTheDocument();
  });

  it('renders the SDK product page content', () => {
    renderRoute(<ProductSdk />);

    expect(screen.getByRole('heading', { name: /Build agents your way/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join Slack' })).toHaveAttribute('href', 'https://docs.openhands.dev/sdk');
    expect(screen.getByText('Programmatic task creation')).toBeInTheDocument();
    expect(screen.getByText('Build domain-specific agents')).toBeInTheDocument();
    expect(screen.getByText('What is the Large Codebase SDK?')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Turn OpenHands into your agent platform/i })).not.toBeInTheDocument();
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

    expect(screen.queryByRole('heading', { name: 'Download CLI' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Download Web UI' })).not.toBeInTheDocument();
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
