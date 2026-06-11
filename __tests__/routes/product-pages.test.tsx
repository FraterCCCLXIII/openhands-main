import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { PRODUCT_FEATURE_PAGES, PRODUCT_OG_IMAGE } from '../../src/data/product-feature-pages';
import Product, { meta as productMeta } from '../../src/routes/product';
import ProductCLI, { meta as productCliMeta } from '../../src/routes/product-cli';
import ProductCanvas, { meta as productCanvasMeta } from '../../src/routes/product-canvas';
import ProductSDK, { meta as productSdkMeta } from '../../src/routes/product-sdk';

const renderRoute = (element: ReactElement) => {
  return render(<MemoryRouter>{element}</MemoryRouter>);
};

describe('Product parity routes', () => {
  it('matches the live product page structure and links', () => {
    renderRoute(<Product />);

    expect(
      screen.getByRole('heading', { name: 'Build better software with autonomous cloud agent' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The only open, secure, and scalable agent platform built for real engineering work'
      )
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Get OpenHands' })[0]).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/overview/quickstart',
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
      expect(link).toHaveAttribute('href', 'https://docs.openhands.dev/overview/introduction');
    });

    expect(screen.getByRole('heading', { name: 'Terminal / CLI' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Web GUI' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SDK' })).toBeInTheDocument();
    expect(screen.queryByAltText('Terminal / CLI')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Web GUI')).not.toBeInTheDocument();
    expect(screen.queryByAltText('SDK')).not.toBeInTheDocument();

    const learnMoreLinks = screen.getAllByRole('link', { name: /learn more/i });
    expect(learnMoreLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/product/cli',
      '/product/canvas',
      '/product/sdk',
    ]);

    expect(screen.queryByRole('button', { name: 'Resources' })).not.toBeInTheDocument();
  });

  it('renders the SDK product page content', () => {
    const { container } = renderRoute(<ProductSDK />);

    expect(
      screen.getByRole('heading', { name: 'Build agents your way.' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Join Slack' })[0]).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/sdk',
    );
    expect(screen.getByText('Tool and API integrations')).toBeInTheDocument();
    expect(screen.getByAltText('asci art')).toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands SDK interface preview.')).not.toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands comparison illustration.')).not.toBeInTheDocument();
    expect(screen.getAllByText('Build agents your way.').length).toBeGreaterThan(0);
    expect(screen.getByText('Start building with the SDK.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Join Slack' }).length).toBeGreaterThan(0);
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
    expect(summaryLabel).toHaveClass('fluid-h4');
  });

  it('renders the Agent Canvas product page content', () => {
    const { container } = renderRoute(<ProductCanvas />);

    expect(
      screen.getByRole('heading', { name: 'From prompting to process' })
    ).toBeInTheDocument();
    expect(screen.getByText('Agent Canvas')).toBeInTheDocument();
    expect(container.querySelector('main')).toHaveClass('product-feature-page--gui');
    expect(screen.getByRole('link', { name: 'Download for free' })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup',
    );
    expect(screen.getByTestId('hero-app-preview')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-wf-el="hero-preview-slide"]')).toHaveLength(6);
    expect(screen.getByText('More than a new UI')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Parallel agents, not single sessions' })).toBeInTheDocument();
    expect(screen.getByText(/Customizable via plugins/)).toBeInTheDocument();
    expect(container.querySelectorAll('.product-canvas-feature-grid [data-wf-el="card"]')).toHaveLength(6);
    expect(screen.getByText('Agent Client Protocol')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "You don't have to switch to go further." })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/run-openhands/acp',
    );
    expect(screen.getByRole('link', { name: /read the spec/i })).toHaveAttribute(
      'href',
      'https://agentclientprotocol.com/',
    );
    expect(container.querySelectorAll('.product-canvas-acp-panel [data-wf-el="card"]')).toHaveLength(4);
    expect(screen.getByText('Where your agents run')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Local-first. Cloud-ready.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Local agent-server' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Self-hosted VM' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'OpenHands Cloud' })).toBeInTheDocument();
    expect(container.querySelectorAll('.product-canvas-backends-section [data-wf-el="card"]')).toHaveLength(3);
    expect(screen.getByText('Get started')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Running in under 5 minutes.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Download Agent Canvas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub Releases' })).toHaveAttribute(
      'href',
      'https://github.com/OpenHands/agent-canvas/releases',
    );
    expect(screen.getByRole('link', { name: 'Connection Guide' })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/run-openhands/acp',
    );
    expect(screen.getByRole('link', { name: 'Need Inspiration?' })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/automations/overview',
    );
    expect(container.querySelectorAll('.product-canvas-get-started-section [data-wf-el="card"]')).toHaveLength(3);
    expect(screen.queryByText('Trust requires visibility.')).not.toBeInTheDocument();
    expect(screen.getByText('Ready to go further?')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Agent Canvas is step one. When you're ready, scale into Teams, Enterprise, or build custom agents with the SDK.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Download Agent Canvas' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Explore Enterprise' })).toHaveAttribute('href', '/enterprise');
    expect(screen.queryByAltText('OpenHands Web GUI review interface.')).not.toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands Web GUI planning interface.')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: "FAQ's" })).not.toBeInTheDocument();
    expect(screen.queryByText('What is the OpenHands GUI?')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.product-faq-section summary label')).toHaveLength(0);
    expect(
      screen.queryByText('The only open, secure, and scalable agent platform built for real engineering work'),
    ).not.toBeInTheDocument();
    expect(container.querySelectorAll('.product-comparison-section')).toHaveLength(0);
    expect(screen.queryByRole('heading', { name: 'Key capabilities' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'How teams use it' })).not.toBeInTheDocument();
    expect(container.querySelectorAll('.product-showcase-section')).toHaveLength(0);
  });

  it('renders the CLI product page content', () => {
    const { container } = renderRoute(<ProductCLI />);

    expect(
      screen.getByRole('heading', { name: 'Agentic power from the command line.' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Get Started' })[0]).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/openhands/usage/cli/installation',
    );
    expect(
      screen.getByText('Headless mode for CI/CD and background tasks')
    ).toBeInTheDocument();
    expect(screen.getByAltText('asci art')).toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands CLI interface screenshot.')).not.toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands comparison illustration.')).not.toBeInTheDocument();
    expect(container.querySelectorAll('summary label')).toHaveLength(5);
    expect(container.querySelector('summary label')).toHaveClass('fluid-h4');
    expect(container.querySelector('main')).toHaveClass('product-feature-page--cli');
    expect(container.querySelector('.product-detail-grid--top')).toBeInTheDocument();
    expect(screen.getByText('Control your agents like real infrastructure.')).toBeInTheDocument();
    expect(screen.getByText('Run OpenHands from the terminal or automate it end to end with the CLI.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Get OpenHands' }).length).toBeGreaterThan(0);
  });

  it('stores product detail FAQs with the rest of the product page data', () => {
    const detailPages = [
      { element: <ProductSDK />, variant: 'sdk' as const, renderFaqs: true },
      { element: <ProductCanvas />, variant: 'gui' as const, renderFaqs: false },
      { element: <ProductCLI />, variant: 'cli' as const, renderFaqs: true },
    ];

    detailPages.forEach(({ element, variant, renderFaqs }) => {
      const page = PRODUCT_FEATURE_PAGES[variant];
      const { container, unmount } = renderRoute(element);

      expect(page.faqs).toHaveLength(5);
      if (renderFaqs) {
        expect(container.querySelectorAll('summary label')).toHaveLength(page.faqs.length);
        page.faqs.forEach((faq) => {
          expect(screen.getByText(faq.answer)).toBeInTheDocument();
        });
      } else {
        expect(container.querySelectorAll('.product-faq-section summary label')).toHaveLength(0);
      }

      unmount();
    });
  });

  it('locks live product detail CTA, proof heading, and FAQ typography parity', () => {
    const detailPages: Array<{
      element: ReactElement;
      proofHeading?: string;
      proofHeadingClass?: string;
      closingDescription: string;
      forbiddenImageAlt: RegExp;
    }> = [
      {
        element: <ProductSDK />,
        proofHeading: 'Solve real edge cases.',
        proofHeadingClass: 'text-white',
        closingDescription: 'Start building with the SDK.',
        forbiddenImageAlt: /sdk interface preview|comparison illustration/i,
      },
      {
        element: <ProductCanvas />,
        closingDescription:
          "Agent Canvas is step one. When you're ready, scale into Teams, Enterprise, or build custom agents with the SDK.",
        forbiddenImageAlt: /web gui screenshot|web gui review interface|web gui planning interface|large black hole/i,
      },
      {
        element: <ProductCLI />,
        proofHeading: 'Real autonomy needs observability and repeatability.',
        proofHeadingClass: 'text-white',
        closingDescription: 'Run OpenHands from the terminal or automate it end to end with the CLI.',
        forbiddenImageAlt: /cli interface screenshot|comparison illustration/i,
      },
    ];

    detailPages.forEach(({ element, proofHeading, proofHeadingClass, closingDescription, forbiddenImageAlt }) => {
      const { container, unmount } = renderRoute(element);

      if (proofHeading && proofHeadingClass) {
        expect(screen.getByRole('heading', { name: proofHeading })).toHaveClass(proofHeadingClass);
      }
      expect(screen.getByText(closingDescription)).toBeInTheDocument();
      container.querySelectorAll('.product-faq-section summary label').forEach((label) => {
        expect(label).toHaveClass('fluid-h4');
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
      { property: 'og:image:secure_url', content: PRODUCT_OG_IMAGE },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: title },
      { property: 'og:url', content: `https://openhands.dev${pathname}` },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'OpenHands' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: PRODUCT_OG_IMAGE },
      { name: 'twitter:image:alt', content: title },
      { tagName: 'link', rel: 'canonical', href: `https://openhands.dev${pathname}` },
    ]);
  };

  it('matches live product metadata for the root route', () => {
    expectSocialMetadata(productMeta({ location: { pathname: '/product' } } as never), {
      title: 'OpenHands Product | Autonomous Cloud Coding Agents',
      description:
        'Explore how OpenHands revolutionizes software development with secure, model-agnostic cloud coding agents. Delegate, execute, and review code autonomously.',
      pathname: '/product',
    });
  });

  it('matches live metadata for the dedicated product pages', () => {
    expectSocialMetadata(productSdkMeta({ location: { pathname: '/product/sdk' } } as never), {
      title: 'OpenHands SDK | Secure, Scalable Agentic Software Development',
      description: 'Extend OpenHands with code, not constraints.',
      pathname: '/product/sdk',
    });

    expectSocialMetadata(productCanvasMeta({ location: { pathname: '/product/canvas' } } as never), {
      title: 'OpenHands Agent Canvas | Secure, Scalable Agentic Software Development',
      description:
        'Agent Canvas is a local, visual workspace for running AI coding agents. Install on your laptop, connect the agents you already use, and start.',
      pathname: '/product/canvas',
    });

    expectSocialMetadata(productCliMeta({ location: { pathname: '/product/cli' } } as never), {
      title: 'OpenHands CLI | Secure, Scalable Agentic Software Development',
      description:
        'Run, inspect, and automate OpenHands agents directly from the terminal or headlessly in your pipelines with full visibility and control.',
      pathname: '/product/cli',
    });
  });
});
