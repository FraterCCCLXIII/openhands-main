import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Product from '../../src/routes/product';
import ProductAgentCanvas from '../../src/routes/product-agent-canvas';
import ProductCli from '../../src/routes/product-cli';
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
    expect(screen.getByRole('heading', { name: /From a single local agent to an org-wide control plane/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Agent Canvas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Automations' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'OpenHands Cloud' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SDK' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Learn more' })).toHaveLength(4);
    expect(screen.getAllByRole('link', { name: 'Learn more' }).map((link) => link.getAttribute('href'))).toEqual([
      '/product/agent-canvas',
      'https://docs.openhands.dev/openhands/usage/automations/overview#automations-overview',
      'https://app.all-hands.dev/',
      '/product/sdk',
    ]);
    expect(screen.getAllByRole('link', { name: 'Download Agent Canvas' })[0]).toHaveAttribute('href', 'https://github.com/OpenHands/OpenHands/releases');
    expect(screen.getByText('The only open, secure, and scalable agent platform built for real engineering work')).toBeInTheDocument();
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
    expect(screen.getByRole('heading', { name: /The CLI is still here\. Agent Canvas is where agents scale/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /A lightweight path for terminal-first developers/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Download Agent Canvas' })[0]).toHaveAttribute(
      'href',
      'https://github.com/OpenHands/OpenHands/releases',
    );
    expect(screen.getByText('Terminal-first task execution')).toBeInTheDocument();
    expect(screen.getByText('Move repeated work into Agent Canvas automations')).toBeInTheDocument();
    expect(screen.getByText('Is the OpenHands CLI still available?')).toBeInTheDocument();
    expect(container.querySelectorAll('summary label')).toHaveLength(FAQ_LABEL_COUNT);
    expect(
      screen.queryByRole('heading', { name: /Ready for more than one session/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the Agent Canvas product page content', () => {
    renderRoute(<ProductAgentCanvas />);

    expect(screen.getByRole('heading', { name: /Run agents\. Not sessions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download for free' })).toHaveAttribute('href', 'https://github.com/OpenHands/OpenHands/releases');
    expect(screen.getByText('Parallel agents in one view')).toBeInTheDocument();
    expect(screen.getByText('Run four agents in parallel, each on its own branch')).toBeInTheDocument();
    expect(screen.getByText('What is Agent Canvas?')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Your agents should work when you don't/i })).not.toBeInTheDocument();
  });

  it('renders the SDK product page content', () => {
    renderRoute(<ProductSdk />);

    expect(screen.getByRole('heading', { name: /Build agents your way/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Get Started' })[0]).toHaveAttribute('href', 'https://docs.openhands.dev/sdk/getting-started');
    expect(screen.getByText('Unified Python API')).toBeInTheDocument();
    expect(screen.getByText('Build domain-specific agents')).toBeInTheDocument();
    expect(screen.getByText('What is the OpenHands SDK?')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Build agents your way/i })).toBeInTheDocument();
  });

  it('renders the updated enterprise page content', () => {
    const { container } = renderRoute(<Enterprise />);

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
    expect(screen.getByText(/Automation doesn't mean unsupervised\./i)).toBeInTheDocument();
    expect(container.querySelector('img[data-wf-el="acp_graphic_img"]')).toHaveAttribute('src', '/assets/webflow/enterprise/control-plane.png');
    expect(container.querySelector('img[data-wf-el="acp_quote_img"]')).toHaveAttribute('src', '/assets/webflow/enterprise/image96x96.png');
    expect(container.querySelector('img[data-wf-el="acp_quote_logo"]')).toHaveAttribute('src', '/assets/webflow/enterprise/c3ailogo.svg');

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

    // Closing footer section mirrors the live enterprise footer, including the visible copyright.
    expect(screen.getByText(/What comes after Claude Code\?/i)).toBeInTheDocument();
    expect(screen.getByText(/© \d{4} OpenHands - All rights reserved/i)).toBeInTheDocument();

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
      'https://www.youtube.com/embed/20HNd4cb2vA'
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
    expect(screen.getByText(/they’ve curated is second to none/i)).toBeInTheDocument();
    expect(container.querySelectorAll('[data-wf-el="previous-event_content_meta_icon"]')).toHaveLength(8);
    expect(screen.getByText(/OpenHands - All rights reserved/i)).toBeInTheDocument();
  });
});
