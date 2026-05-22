import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import ProductSdk from './product-sdk';

const renderProductSdk = () =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={['/product/sdk']}>
      <ProductSdk />
    </MemoryRouter>,
  );

describe('/product/sdk parity markup', () => {
  it('renders the live SDK page copy and CTA labels', () => {
    const html = renderProductSdk();

    expect(html).toContain('Extend OpenHands with code, not constraints.');
    expect(html).toContain('An open SDK for building custom agents and workflows.');
    expect(html).toContain('Solve real edge cases.');
    expect(html).toContain('Programmatic task creation');
    expect(html).toContain('Tool and API integrations');
    expect(html).toContain('Custom agent behaviors');
    expect(html).toContain('Turn OpenHands into your agent platform.');
    expect(html).toContain('View SDK Doc');
    expect(html).toContain('Try it live');
    expect(html).toContain('View SDK Docs');

    expect(html).not.toContain('The open foundation for custom coding agents.');
    expect(html).not.toContain('See developer docs');
    expect(html).not.toContain('Download Agent Canvas');
  });

  it('keeps the live overlay-link accessible labels for hero CTAs', () => {
    const html = renderProductSdk();

    expect(html).toContain('aria-label="Join Slack"');
    expect(html).toContain('<span class="sr-only">Join Slack</span>');
    expect(html).toContain('href="/contact"');
  });

  it('marks SDK product sections for mobile Webflow parity overrides', () => {
    const html = renderProductSdk();

    expect(html).toContain('data-product-feature-page="sdk"');
    expect(html).toContain('product-feature-grid-section');
    expect(html).toContain('product-comparison-section');
    expect(html).toContain('product-faq-section');
    expect(html.match(/data-wf-el="asci-embed"/g)).toHaveLength(1);
  });
});
