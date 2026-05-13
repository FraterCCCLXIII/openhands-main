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

    expect(screen.getAllByText('Product').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: /Build better software with autonomous cloud agent/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Terminal / CLI' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Web GUI' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SDK' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Learn more' })).toHaveLength(3);
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

    // New live hero
    expect(screen.getByRole('heading', { level: 1, name: /From agents to systems/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Scale AI agents in production with the control, visibility, and repeatability/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Book a demo' })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'Trust Center' })).toHaveAttribute(
      'href',
      'https://app.vanta.com/openhands.dev/trust/an0kgh9goh7xyqkhsb6tlp',
    );

    // Control plane intro section
    expect(
      screen.getByRole('heading', { name: /A control plane for every layer of your agent stack/i }),
    ).toBeInTheDocument();

    // Govern agents grid: each of the five card headings present
    expect(
      screen.getByRole('heading', { name: /Agents that run themselves, on your terms\./i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Know where every token goes/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Agents get access to what they need\. Nothing more\./i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Measure what's working\. Improve what isn't\./i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /One view for every team\./i })).toBeInTheDocument();

    // Event-to-PR dark section
    expect(
      screen.getByRole('heading', { name: /From event to PR, no human in the loop\./i }),
    ).toBeInTheDocument();

    // C3.ai quote (rendered as paragraph, not heading)
    expect(
      screen.getByText(/OpenHands was the only solution that let us prompt an autonomous coding agent/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Sina Pakazad, VP of Data Science at C3\.ai/i)).toBeInTheDocument();

    // Built-for-teams grid
    expect(
      screen.getByRole('heading', { name: /Built for teams running agents at scale\./i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Self-hosted in your VPC' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Source-available' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Research team access' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Enterprise integrations included' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bring your own LLM' })).toBeInTheDocument();

    // Whitepaper dark section
    expect(screen.getByRole('link', { name: 'Download the Whitepaper' })).toHaveAttribute(
      'href',
      '/whitepapers/modernize-legacy-systems-with-ai-agents',
    );

    // Closing "What comes after Claude Code?" CTA now lives inside
    // the global footer (wired through root.tsx via
    // PRODUCT_SUBPAGE_CTA['/enterprise']) rather than as a separate
    // section on the page itself, matching live's structure.  The
    // route component therefore should NOT render that text directly;
    // the footer is rendered by the layout, not the route in tests.
    expect(screen.getByText(/What comes after Claude Code\?/i)).toBeInTheDocument();

    // Old marketing-page placeholders should be gone now
    expect(screen.queryByText(/Why Enterprises Choose OpenHands/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Powering enterprise AI with the world/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Proven results across industries/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Measured impact')).not.toBeInTheDocument();
  });

  it('renders the updated community page content', () => {
    const { container } = renderRoute(<Community />);

    expect(screen.getByRole('heading', { name: /Join the OpenHands Community/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Latest Community Call/i })).toBeInTheDocument();
    expect(screen.getByTitle('Latest OpenHands community call')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/H8wIK1_0zNU'
    );
    expect(screen.getByText('May 8, 2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Upcoming Events/i })).toBeInTheDocument();
    expect(screen.queryByText('Scale Enterprise AI Agents')).not.toBeInTheDocument();
    expect(screen.queryByText(/5:15pm — Doors Open/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Recording and agenda will be available post meeting\./i)).toHaveLength(2);
    expect(screen.getByRole('heading', { name: /Recognizing first-time contributors/i })).toBeInTheDocument();
    expect(screen.queryByText('@alexdev')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Community contributor spotlight/i })).toBeInTheDocument();
    expect(container.querySelector('img[src="/assets/webflow/team/698653c2074b111e59086ff8_mike.jpeg"]')).not.toBeNull();
    expect(screen.getByText(/My team uses OpenHands for all our development tasks/i)).toBeInTheDocument();
  });
});
