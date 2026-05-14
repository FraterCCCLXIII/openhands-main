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
    const { container } = renderRoute(<ProductSDK />);

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
    expect(screen.getByText('Turn OpenHands into your agent platform.')).toBeInTheDocument();
    expect(screen.getByText('Start building with the SDK.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Try it live' }).length).toBeGreaterThan(0);
    const summaryLabel = container.querySelector('summary label');
    expect(summaryLabel).toBeInTheDocument();
    expect(summaryLabel).toHaveStyle({ fontSize: '24px' });
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
    expect(screen.getByText('Bring your team into the loop.')).toBeInTheDocument();
    expect(screen.getByText('Use the OpenHands Web GUI to collaborate with agents.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Try it live' }).length).toBeGreaterThan(1);
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
    expect(container.querySelector('summary label')).toHaveStyle({ fontSize: '24px' });
    expect(screen.getByText('Control your agents like real infrastructure.')).toBeInTheDocument();
    expect(screen.getByText('Run OpenHands from the terminal or automate it end to end with the CLI.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Try it live' }).length).toBeGreaterThan(0);
  });

  it('locks live product detail CTA, proof heading, and FAQ typography parity', () => {
    const detailPages: Array<{
      element: ReactElement;
      proofHeading: string;
      proofHeadingClass: string;
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
        element: <ProductGUI />,
        proofHeading: 'Trust requires visibility.',
        proofHeadingClass: 'text-brand-fg',
        closingDescription: 'Use the OpenHands Web GUI to collaborate with agents.',
        forbiddenImageAlt: /web gui screenshot|web gui review interface|web gui planning interface/i,
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

  it('matches live product metadata for the root route', () => {
    expectSocialMetadata(productMeta({ location: { pathname: '/product' } } as never), {
      title: 'OpenHands Product | Autonomous Cloud Coding Agents',
      description:
        'Explore how OpenHands revolutionizes software development with secure, model-agnostic cloud coding agents. Delegate, execute, and review code autonomously.',
      pathname: '/product',
    });
  });

  it('matches live metadata for the dedicated product pages', () => {
    expectSocialMetadata(productSdkMeta({} as never), {
      title: 'OpenHands SDK | Secure, Scalable Agentic Software Development',
      description: 'Extend OpenHands with code, not constraints.',
      pathname: '/product/sdk',
    });

    expectSocialMetadata(productGuiMeta({} as never), {
      title: 'OpenHands Web GUI | Secure, Scalable Agentic Software Development',
      description: 'Plan, run, and review agent work together in a collaborative UI.',
      pathname: '/product/gui',
    });

    expectSocialMetadata(productCliMeta({} as never), {
      title: 'OpenHands CLI | Secure, Scalable Agentic Software Development',
      description:
        'Run, inspect, and automate OpenHands agents directly from the terminal or headlessly in your pipelines with full visibility and control.',
      pathname: '/product/cli',
    });
  });
});
