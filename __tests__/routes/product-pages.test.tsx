import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { PRODUCT_OG_IMAGE } from '../../src/data/product-feature-pages';
import Product, { meta as productMeta } from '../../src/routes/product';
import ProductAgentCanvas, { meta as productAgentCanvasMeta } from '../../src/routes/product-agent-canvas';
import ProductCLI, { meta as productCliMeta } from '../../src/routes/product-cli';
import ProductSDK, { meta as productSdkMeta } from '../../src/routes/product-sdk';

const AGENT_CANVAS_DOWNLOAD_URL = 'https://github.com/OpenHands/OpenHands/releases';
const OPENHANDS_DOCS_URL = 'https://docs.openhands.dev/overview/introduction';
const AGENT_CANVAS_CONNECTION_GUIDE_URL = 'https://docs.openhands.dev/openhands/usage/run-openhands/acp';
const OPENHANDS_AUTOMATIONS_GUIDE_URL = 'https://docs.openhands.dev/openhands/usage/automations/overview#automations-overview';

const renderRoute = (element: ReactElement) => {
  return render(<MemoryRouter>{element}</MemoryRouter>);
};

describe('Product parity routes', () => {
  it('matches the refreshed product overview structure and links', () => {
    renderRoute(<Product />);

    expect(
      screen.getByRole('heading', { name: 'From a single local agent to an org-wide control plane.' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The only open, secure, and scalable agent platform built for real engineering work'
      )
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Download Agent Canvas' })[0]).toHaveAttribute(
      'href',
      AGENT_CANVAS_DOWNLOAD_URL,
    );
    expect(
      screen.getByText('Building the open standard for autonomous software development.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Building the open standard for autonomous software development.',
      })
    ).not.toBeInTheDocument();

    const docLinks = screen.getAllByRole('link', { name: 'See developer docs' });
    expect(docLinks.length).toBeGreaterThan(0);
    docLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', OPENHANDS_DOCS_URL);
    });

    expect(screen.getByRole('heading', { name: 'Agent Canvas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Automations' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'OpenHands Cloud' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SDK' })).toBeInTheDocument();

    const learnMoreLinks = screen.getAllByRole('link', { name: /learn more/i });
    expect(learnMoreLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/product/agent-canvas',
      OPENHANDS_AUTOMATIONS_GUIDE_URL,
      'https://app.all-hands.dev/',
      '/product/sdk',
    ]);

    expect(screen.queryByRole('button', { name: 'Resources' })).not.toBeInTheDocument();
  });

  it('renders the SDK product page content', () => {
    const { container } = renderRoute(<ProductSDK />);

    expect(
      screen.getByRole('heading', { name: 'Build agents your way.' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Get Started' })[0]).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/sdk/getting-started',
    );
    expect(screen.getByText('Unified Python API')).toBeInTheDocument();
    expect(screen.getByAltText('asci art')).toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands SDK interface preview.')).not.toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands comparison illustration.')).not.toBeInTheDocument();
    expect(screen.getAllByText('Build agents your way.').length).toBeGreaterThan(0);
    expect(screen.getByText('Start with the SDK when you need custom agent behavior or internal platform integrations.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Download Agent Canvas' }).length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-wf-el="asci-wrap"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-wf-el="asci-media"]')).toHaveLength(3);
    expect(container.querySelectorAll('tr[data-wf-el="product-table_tr"]')).toHaveLength(6);
    expect(container.querySelectorAll('[data-wf-el="product-table_th"]')).toHaveLength(30);
    expect(container.querySelectorAll('svg[data-wf-el="accordion-icon"] path').item(0)).toHaveAttribute(
      'd',
      'M17 17L27.3137 17L27.3137 15H17V4.68631L15 4.68631L15 15H4.68629L4.68629 17L15 17V27.3137H17V17Z',
    );
    expect(screen.getByText('OpenHands - All rights reserved', { exact: false })).toBeInTheDocument();
    const summaryLabel = container.querySelector('summary label');
    expect(summaryLabel).toBeInTheDocument();
    expect(summaryLabel).toHaveStyle({ fontSize: '24px' });
  });

  it('renders the Agent Canvas product page content', () => {
    renderRoute(<ProductAgentCanvas />);

    expect(
      screen.getByRole('heading', { name: 'Run agents. Not sessions.' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download for free' })).toHaveAttribute(
      'href',
      AGENT_CANVAS_DOWNLOAD_URL,
    );
    expect(screen.getAllByRole('link', { name: 'Read docs' })[0]).toHaveAttribute(
      'href',
      AGENT_CANVAS_CONNECTION_GUIDE_URL,
    );
    expect(screen.getByText("One session isn't a system.")).toBeInTheDocument();
    expect(screen.getByText("Your agents should work when you don't.")).toBeInTheDocument();
    expect(screen.getByText('Download Agent Canvas and go from single-session prompts to a fleet of always-on agents. Free, open source, no Docker.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Download Agent Canvas' }).length).toBeGreaterThan(1);
    expect(screen.queryByAltText('OpenHands Web GUI review interface.')).not.toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands Web GUI planning interface.')).not.toBeInTheDocument();
  });

  it('renders the CLI product page content', () => {
    const { container } = renderRoute(<ProductCLI />);

    expect(
      screen.getByRole('heading', { name: 'The CLI is still here. Agent Canvas is where agents scale.' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Download Agent Canvas' })[0]).toHaveAttribute(
      'href',
      AGENT_CANVAS_DOWNLOAD_URL,
    );
    expect(
      screen.getByText('Upgrade path to Agent Canvas for visual orchestration')
    ).toBeInTheDocument();
    expect(screen.getByAltText('asci art')).toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands CLI interface screenshot.')).not.toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands comparison illustration.')).not.toBeInTheDocument();
    expect(container.querySelectorAll('summary label')).toHaveLength(5);
    expect(container.querySelector('summary label')).toHaveStyle({ fontSize: '24px' });
    expect(screen.getByText('Ready for more than one session?')).toBeInTheDocument();
    expect(screen.getByText('Download Agent Canvas for the local workspace, parallel agents, and built-in automations. Keep the CLI docs nearby for terminal workflows.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'View CLI Docs' }).length).toBeGreaterThan(0);
  });

  it('locks refreshed product detail CTA, proof heading, and FAQ typography parity', () => {
    const detailPages: Array<{
      element: ReactElement;
      proofHeading: string;
      proofHeadingClass: string;
      closingDescription: string;
      forbiddenImageAlt: RegExp;
    }> = [
      {
        element: <ProductSDK />,
        proofHeading: 'Bring your tools, models, and workflows.',
        proofHeadingClass: 'text-white',
        closingDescription: 'Start with the SDK when you need custom agent behavior or internal platform integrations.',
        forbiddenImageAlt: /sdk interface preview|comparison illustration/i,
      },
      {
        element: <ProductAgentCanvas />,
        proofHeading: "One session isn't a system.",
        proofHeadingClass: 'text-brand-fg',
        closingDescription: 'Download Agent Canvas and go from single-session prompts to a fleet of always-on agents. Free, open source, no Docker.',
        forbiddenImageAlt: /web gui screenshot|web gui review interface|web gui planning interface/i,
      },
      {
        element: <ProductCLI />,
        proofHeading: 'Keep the terminal. Add the system layer.',
        proofHeadingClass: 'text-white',
        closingDescription: 'Download Agent Canvas for the local workspace, parallel agents, and built-in automations. Keep the CLI docs nearby for terminal workflows.',
        forbiddenImageAlt: /cli interface screenshot|comparison illustration/i,
      },
    ];

    detailPages.forEach(({ element, proofHeading, proofHeadingClass, closingDescription, forbiddenImageAlt }) => {
      const { container, unmount } = renderRoute(element);

      expect(screen.getByRole('heading', { name: proofHeading })).toHaveClass(proofHeadingClass);
      expect(screen.getByText(closingDescription)).toBeInTheDocument();
      container.querySelectorAll('summary label').forEach((label) => {
        expect(label).toHaveStyle({ fontSize: '24px' });
      });
      Array.from(container.querySelectorAll('img[alt]')).forEach((image) => {
        expect(image.getAttribute('alt') ?? '').not.toMatch(forbiddenImageAlt);
      });

      unmount();
    });
  });

  const expectSocialMetadata = (
    entries: unknown,
    { title, description, pathname }: { title: string; description: string; pathname: string }
  ) => {
    expect(entries).toEqual([
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: PRODUCT_OG_IMAGE },
      { property: 'og:url', content: `https://openhands.dev${pathname}` },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'OpenHands' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: PRODUCT_OG_IMAGE },
      { rel: 'canonical', href: `https://openhands.dev${pathname}` },
    ]);
  };

  it('matches refreshed product metadata for the root route', () => {
    expectSocialMetadata(productMeta({ location: { pathname: '/product' } } as never), {
      title: 'OpenHands Product | Agent Canvas, Automations, Cloud, and SDK',
      description:
        'Explore the OpenHands platform: Agent Canvas for local parallel agents, Automations for always-on workflows, Cloud for scale, and the SDK for custom agent builders.',
      pathname: '/product',
    });
  });

  it('matches refreshed metadata for the dedicated product pages', () => {
    expectSocialMetadata(productSdkMeta({} as never), {
      title: 'OpenHands SDK | Build agents your way',
      description:
        'Use the OpenHands SDK to build custom agents, internal tooling, and production agent services on top of the same open foundation that powers Agent Canvas.',
      pathname: '/product/sdk',
    });

    expectSocialMetadata(productAgentCanvasMeta({} as never), {
      title: 'OpenHands Agent Canvas | Run agents, not sessions',
      description:
        'Download Agent Canvas, the local visual workspace for running AI coding agents in parallel, connecting ACP-compatible agents, and creating automations.',
      pathname: '/product/agent-canvas',
    });

    expectSocialMetadata(productCliMeta({} as never), {
      title: 'OpenHands CLI | Terminal access for OpenHands agents',
      description:
        'The OpenHands CLI remains available for terminal-first workflows, while Agent Canvas is the recommended path for parallel sessions, automations, and always-on agents.',
      pathname: '/product/cli',
    });
  });
});
