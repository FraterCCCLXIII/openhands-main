import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import Product from './product';
import ProductCanvas from './product-canvas';

const renderProduct = () =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={['/product']}>
      <Product />
    </MemoryRouter>,
  );

const renderProductCanvas = () =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={['/product/canvas']}>
      <ProductCanvas />
    </MemoryRouter>,
  );

describe('/product parity markup', () => {
  it('keeps Webflow parity anchors for product surface cards and comparison table', () => {
    const html = renderProduct();

    expect(html.match(/data-wf-el="asci-embed"/g)).toHaveLength(2);
    expect(html.match(/data-wf-el="ascii-embed"/g)).toHaveLength(2);
    expect(html.match(/data-wf-el="container"/g)).toHaveLength(4);
    expect(html.match(/data-wf-el="button"/g)).toHaveLength(7);
    expect(html.match(/data-wf-el="btn-text"/g)).toHaveLength(7);
    expect(html.match(/data-wf-el="product-list_img_wrap"/g)).toHaveLength(3);
    expect(html.match(/data-wf-el="product-list_img"/g)).toHaveLength(3);
    expect(html.match(/data-wf-el="product-table_tr"/g)).toHaveLength(6);
    expect(html.match(/data-wf-el="product-table_th"/g)).toHaveLength(30);
  });

  it('keeps the product canvas footer Webflow anchors aligned with live', () => {
    const html = renderProductCanvas();

    expect(html.match(/data-wf-el="container"/g)).toHaveLength(6);
    expect(html.match(/data-wf-el="button"/g)).toHaveLength(6);
    expect(html.match(/data-wf-el="btn-text"/g)).toHaveLength(6);
    expect(html).toContain('class="absolute inset-0 overflow-hidden"');
  });

  it('preserves live Webflow product copy spacing', () => {
    const html = renderProduct();

    expect(html).toContain('governance, and choice.');
    expect(html).toContain('collaborative UI.');
  });


  it('exposes mobile Webflow parity hooks for product layout', () => {
    const html = renderProduct();

    expect(html).toContain('class="product-page page-main"');
    expect(html).toContain('max-height:var(--product-hero-ascii-max-height)');
    expect(html).toContain('width:var(--product-image-wrap-width)');
    expect(html).toContain('srcSet="/assets/webflow/misc/699490d1d9729682e0daf0a5_cli-p-500.png 500w');
    expect(html).toContain('sizes="(max-width: 978px) 100vw, 978px"');
    expect(html).toContain('var(--product-table-col-4, 280px)');
  });

  it('renders live footer copyright text visibly for product parity', () => {
    const html = renderProduct();

    expect(html).toMatch(/©(?:&nbsp;|\u00a0| )?<span/);
    expect(html.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ')).toContain(' OpenHands - All rights reserved');
    expect(html).toContain('data-wf-el="eyebrow"');
  });
});
