import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import Product from '../../src/routes/product';
import ProductCli from '../../src/routes/product-cli';
import ProductCanvas from '../../src/routes/product-canvas';
import ProductSdk from '../../src/routes/product-sdk';
import Enterprise from '../../src/routes/enterprise';
import Community from '../../src/routes/community';

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  const recording = 'Recording and agenda will be available post meeting.';

  return {
    ...actual,
    useLoaderData: () => ({
      latestCommunityCall: {
        description: 'Catch up on our most recent community call.',
        date: 'May 8, 2026',
        duration: '17:13',
        videoUrl: 'https://www.youtube.com/watch?v=20HNd4cb2vA',
        embedUrl: 'https://www.youtube.com/embed/20HNd4cb2vA',
      },
      events: [
        { title: 'OpenHands Community Call - June 18th', description: recording, date: 'Jun 18, 2026', time: '11:00 AM CDT', startsAt: '2026-06-18T16:00:00Z', href: 'https://luma.com/e1' },
        { title: 'OpenHands Community Call - Jul 9th', description: recording, date: 'Jul 9, 2026', time: '11:00 AM CDT', startsAt: '2026-07-09T16:00:00Z', href: 'https://luma.com/e2' },
        { title: 'OpenHands Community Call - Jul 23rd', description: 'Join our community call to hear updates and ask questions.', date: 'Jul 23, 2026', time: '11:00 AM CDT', startsAt: '2026-07-23T16:00:00Z', href: 'https://luma.com/e3' },
      ],
      firstTimeContributors: Array.from({ length: 4 }, (_, i) => ({ name: `user${i}`, title: 'First PR', href: 'https://github.com/OpenHands/OpenHands/pull/1', avatar: 'https://avatars.githubusercontent.com/u/1?v=4' })),
    }),
  };
});

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
      '/product/canvas',
      '/product/sdk',
    ]);
    expect(screen.getAllByRole('link', { name: 'Get OpenHands' })[0]).toHaveAttribute('href', 'https://docs.openhands.dev/overview/quickstart');
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
    expect(screen.getAllByRole('link', { name: 'Get Started' })[0]).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/cli/installation',
    );
    expect(screen.getByText('Intuitive and powerful Terminal UX')).toBeInTheDocument();
    expect(screen.getByText('Fix bugs before standup')).toBeInTheDocument();
    expect(screen.getByText('Does the OpenHands CLI require cloud connectivity?')).toBeInTheDocument();
    expect(container.querySelectorAll('summary label')).toHaveLength(FAQ_LABEL_COUNT);
    expect(container.querySelectorAll('[data-wf-el="accordion-item"][open]')).toHaveLength(0);
    expect(
      screen.queryByRole('heading', { name: /Control your agents like real infrastructure/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the Agent Canvas product page content', () => {
    renderRoute(<ProductCanvas />);

    expect(screen.getByRole('heading', { name: /From prompting to process/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download for free' })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup',
    );
    expect(screen.getByText('Generate technical plans and PRDs')).toBeInTheDocument();
    expect(screen.getByText('Break epics into agent-sized tasks')).toBeInTheDocument();
    expect(screen.getByText('What is the OpenHands GUI?')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Bring your team into the loop/i })).not.toBeInTheDocument();
  });

  it('renders the SDK product page content', () => {
    renderRoute(<ProductSdk />);

    expect(screen.getByRole('heading', { name: /Build agents your way/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Join Slack' })[0]).toHaveAttribute('href', 'https://docs.openhands.dev/sdk');
    expect(screen.getByText('Programmatic task creation')).toBeInTheDocument();
    expect(screen.getByText('Build domain-specific agents')).toBeInTheDocument();
    expect(screen.getByText('What is the Large Codebase SDK?')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Turn OpenHands into your agent platform/i })).not.toBeInTheDocument();
  });

  it('renders the updated enterprise page content', () => {
    const { container } = renderRoute(<Enterprise />);

    // New live hero
    expect(screen.getByRole('heading', { level: 1, name: /From agents to systems/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Scale AI agents in production with the control, visibility, and repeatability/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Book a demo' })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'Try it' })).toHaveAttribute('href', 'https://install.r9.all-hands.dev/openhands/signup');

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
    expect(container.querySelector('[data-wf-el="acp_graphic"]')).toBeInTheDocument();
    expect(screen.getByText('Agent Control Plane')).toBeInTheDocument();
    expect(container.querySelector('img[data-wf-el="acp_quote_img"]')).toHaveAttribute('src', '/assets/webflow/enterprise/image96x96.png');
    expect(container.querySelector('img[data-wf-el="acp_quote_logo"]')).toHaveAttribute('src', '/assets/webflow/enterprise/c3ailogo.svg');
    expect(container.querySelectorAll('[data-wf-el="heading-stack"]')).toHaveLength(6);
    expect(container.querySelectorAll('[data-wf-el="paragraph-lg"]')).toHaveLength(4);

    expect(container.querySelector('[data-wf-el="container"]')).toHaveStyle({ width: '90%' });
    expect(container.querySelector('[data-wf-el="section-hero"] [data-wf-el="asci-wrap"]')).toHaveStyle({ maxHeight: '100vh' });
    expect(container.querySelector('[data-wf-el="section-hero"] [data-wf-el="asci-embed"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-wf-el="section-hero"] [data-wf-el="asci-embed"]')).toHaveLength(1);
    expect(container.querySelector('[data-wf-el="acp_features_layout"]')).toHaveClass('enterprise-feature-layout');
    expect(container.querySelector('[data-wf-el="acp_features_item"]')).toHaveClass('enterprise-control-card');
    expect(container.querySelector('[data-wf-el="acp_features_item"]')).toHaveAttribute('data-card-index', '0');

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
    expect(screen.getByText(/OpenHands - All rights reserved/i).textContent?.replace(/\u00a0/g, ' ')).toMatch(/© \d{4} OpenHands - All rights reserved/i);

    // Old marketing-page placeholders should be gone now
    expect(screen.queryByText(/Why Enterprises Choose OpenHands/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Powering enterprise AI with the world/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Proven results across industries/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Measured impact')).not.toBeInTheDocument();
  });

  it('renders the updated community page content', () => {
    const { container } = renderRoute(<Community />);

    expect(container.querySelector('main.community-page')).not.toBeNull();
    expect(container.querySelector('section#latest-call')).not.toBeNull();
    expect(container.querySelector('section#contributions')).not.toBeNull();
    expect(container.querySelector('[data-wf-el="events-list_cms_list"]')).toHaveClass('events-list_cms_list');
    expect(container.querySelector('[data-wf-el="community-contributing_cards_wrap"]')).toHaveClass('community-contributing_cards_wrap');
    expect(container.querySelector('[data-wf-el="contributions_list"]')).toHaveClass('contributions_list');
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
