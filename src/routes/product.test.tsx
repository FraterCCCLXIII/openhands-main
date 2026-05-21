import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import Product from './product';

const renderProduct = () =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={['/product']}>
      <Product />
    </MemoryRouter>,
  );

describe('/product parity markup', () => {
  it('keeps Webflow parity anchors for product surface cards and comparison table', () => {
    const html = renderProduct();

    expect(html.match(/data-wf-el="asci-embed"/g)).toHaveLength(1);
    expect(html.match(/data-wf-el="ascii-embed"/g)).toHaveLength(1);
    expect(html.match(/data-wf-el="container"/g)).toHaveLength(4);
    expect(html.match(/data-wf-el="button"/g)).toHaveLength(8);
    expect(html.match(/data-wf-el="btn-text"/g)).toHaveLength(8);
    expect(html.match(/data-wf-el="product-list_img_wrap"/g)).toHaveLength(3);
    expect(html.match(/data-wf-el="product-list_img"/g)).toHaveLength(3);
    expect(html.match(/data-wf-el="product-table_tr"/g)).toHaveLength(6);
    expect(html.match(/data-wf-el="product-table_th"/g)).toHaveLength(30);
  });

  it('preserves live Webflow line-wrap opportunities in product copy', () => {
    const html = renderProduct();

    expect(html).toContain('governance, and choice.');
    expect(html).toContain('collaborative UI.');
  });


  it('renders live footer copyright text visibly for product parity', () => {
    const html = renderProduct();

    expect(html).toMatch(/©(?:&nbsp;|\u00a0| )?<span/);
    expect(html.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ')).toContain(' OpenHands - All rights reserved');
    expect(html).toContain('data-wf-el="eyebrow"');
  });
});
