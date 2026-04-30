import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { PRODUCT_OG_IMAGE } from '../../src/data/product-feature-pages';
import Product, { meta as productMeta } from '../../src/routes/product';
import ProductCLI, { meta as productCliMeta } from '../../src/routes/product-cli';
import ProductGUI, { meta as productGuiMeta } from '../../src/routes/product-gui';
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
    expect(screen.getByRole('link', { name: 'Join Slack' })).toHaveAttribute(
      'href',
      'https://app.all-hands.dev/',
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
      '/product/gui',
      '/product/sdk',
    ]);

    expect(screen.queryByRole('button', { name: 'Resources' })).not.toBeInTheDocument();
  });

  it('renders the SDK product page content', () => {
    renderRoute(<ProductSDK />);

    expect(
      screen.getByRole('heading', { name: 'Build agents your way.' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join Slack' })).toHaveAttribute(
      'href',
      'https://docs.openhands.dev/sdk',
    );
    expect(screen.getByText('Programmatic task creation')).toBeInTheDocument();
    expect(screen.getByAltText('asci art')).toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands SDK interface preview.')).not.toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands comparison illustration.')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Turn OpenHands into your agent platform.' })).not.toBeInTheDocument();
  });

  it('renders the Web GUI product page content', () => {
    renderRoute(<ProductGUI />);

    expect(
      screen.getByRole('heading', { name: 'Agentic development, made human.' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join Slack' })).toHaveAttribute(
      'href',
      'https://app.all-hands.dev/',
    );
    expect(screen.getAllByText('Download Local GUI').length).toBeGreaterThan(0);
    expect(screen.getByText('Trust requires visibility.')).toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands Web GUI review interface.')).not.toBeInTheDocument();
    expect(screen.queryByAltText('OpenHands Web GUI planning interface.')).not.toBeInTheDocument();
  });

  it('renders the CLI product page content', () => {
    const { container } = renderRoute(<ProductCLI />);

    expect(
      screen.getByRole('heading', { name: 'Agentic power from the command line.' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join Slack' })).toHaveAttribute(
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
    expect(
      screen.queryByText('Control your agents like real infrastructure.')
    ).not.toBeInTheDocument();
  });

  it('matches live product metadata for the root route', () => {
    expect(productMeta({ location: { pathname: '/product' } } as never)).toEqual([
      { title: 'OpenHands Product | Autonomous Cloud Coding Agents' },
      {
        name: 'description',
        content:
          'Explore how OpenHands revolutionizes software development with secure, model-agnostic cloud coding agents. Delegate, execute, and review code autonomously.',
      },
      { property: 'og:title', content: 'OpenHands Product | Autonomous Cloud Coding Agents' },
      {
        property: 'og:description',
        content:
          'Explore how OpenHands revolutionizes software development with secure, model-agnostic cloud coding agents. Delegate, execute, and review code autonomously.',
      },
      { property: 'og:url', content: 'https://openhands.dev/product' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { rel: 'canonical', href: 'https://openhands.dev/product' },
    ]);
  });

  it('matches live metadata for the dedicated product pages', () => {
    expect(productSdkMeta({} as never)).toEqual([
      { title: 'OpenHands SDK | Secure, Scalable Agentic Software Development' },
      { name: 'description', content: 'Extend OpenHands with code, not constraints.' },
      {
        property: 'og:title',
        content: 'OpenHands SDK | Secure, Scalable Agentic Software Development',
      },
      { property: 'og:description', content: 'Extend OpenHands with code, not constraints.' },
      { property: 'og:image', content: PRODUCT_OG_IMAGE },
      { property: 'og:type', content: 'website' },
    ]);

    expect(productGuiMeta({} as never)).toEqual([
      { title: 'OpenHands Web GUI | Secure, Scalable Agentic Software Development' },
      {
        name: 'description',
        content: 'Plan, run, and review agent work together in a collaborative UI.',
      },
      {
        property: 'og:title',
        content: 'OpenHands Web GUI | Secure, Scalable Agentic Software Development',
      },
      {
        property: 'og:description',
        content: 'Plan, run, and review agent work together in a collaborative UI.',
      },
      { property: 'og:image', content: PRODUCT_OG_IMAGE },
      { property: 'og:type', content: 'website' },
    ]);

    expect(productCliMeta({} as never)).toEqual([
      { title: 'OpenHands CLI | Secure, Scalable Agentic Software Development' },
      {
        name: 'description',
        content:
          'Run, inspect, and automate OpenHands agents directly from the terminal or headlessly in your pipelines with full visibility and control.',
      },
      {
        property: 'og:title',
        content: 'OpenHands CLI | Secure, Scalable Agentic Software Development',
      },
      {
        property: 'og:description',
        content:
          'Run, inspect, and automate OpenHands agents directly from the terminal or headlessly in your pipelines with full visibility and control.',
      },
      { property: 'og:image', content: PRODUCT_OG_IMAGE },
      { property: 'og:type', content: 'website' },
    ]);
  });
});
