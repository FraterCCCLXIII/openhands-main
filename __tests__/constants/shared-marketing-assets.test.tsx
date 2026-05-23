import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EnterpriseLogoStrip } from '../../src/components/logos/enterprise-logo-strip';
import { CONTACT_CUSTOMER_LOGOS, CUSTOMER_LOGOS, HOME_CUSTOMER_LOGOS } from '../../src/constants/customer-logos';
import { ASCII_HOLE_BACKGROUND_IMAGE, ASCII_HOLE_IMAGE, webflowPngSrcSet } from '../../src/constants/webflow-assets';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readSource = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

describe('shared marketing assets', () => {
  it('keeps customer logos in one canonical catalog with page-specific subsets', () => {
    expect(CUSTOMER_LOGOS).toHaveLength(16);
    expect(CONTACT_CUSTOMER_LOGOS).toBe(CUSTOMER_LOGOS);
    expect(HOME_CUSTOMER_LOGOS).toHaveLength(15);

    const allLogoSources = CUSTOMER_LOGOS.map((logo) => logo.src);
    expect(new Set(allLogoSources).size).toBe(allLogoSources.length);
    expect(HOME_CUSTOMER_LOGOS.every((logo) => CONTACT_CUSTOMER_LOGOS.includes(logo))).toBe(true);
    expect(HOME_CUSTOMER_LOGOS.map((logo) => logo.name)).not.toContain('Flextract');
    expect(CONTACT_CUSTOMER_LOGOS.map((logo) => logo.name)).toContain('Flextract');
  });

  it('renders the enterprise logo strip as typed React SVG instead of raw HTML', () => {
    const { container } = render(<EnterpriseLogoStrip />);

    expect(container.querySelector('[data-wf-el="enterprise-logos"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-wf-el="enterprise-logo"]')).toHaveLength(2);
    expect(container.querySelectorAll('svg')).toHaveLength(2);
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(6);
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('keeps routes free of duplicated raw logo HTML and customer logo path lists', () => {
    const homeSource = readSource('src/routes/home.tsx');
    const contactSource = readSource('src/routes/contact.tsx');

    expect(homeSource).not.toContain('dangerouslySetInnerHTML');
    expect(homeSource).not.toContain('ENTERPRISE_LOGOS_HTML');
    expect(homeSource).toContain('<EnterpriseLogoStrip />');

    for (const routeSource of [homeSource, contactSource]) {
      expect(routeSource).not.toContain('69137f6974b71a1a4a932f82_TikTok_logo.svg');
      expect(routeSource).not.toContain('69137f523b08f91a5aa905b9_Vmware.svg');
    }
  });

  it('centralizes common Webflow asset helpers and ASCII artwork paths', () => {
    expect(ASCII_HOLE_IMAGE.src).toBe('/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png');
    expect(ASCII_HOLE_IMAGE.srcSet).toContain('690b397ae76441160bed52b6_asci-art-hole-p-1080.png 1080w');
    expect(ASCII_HOLE_BACKGROUND_IMAGE).toBe(`url('${ASCII_HOLE_IMAGE.src}')`);
    expect(webflowPngSrcSet('/assets/webflow/misc/example.png')).toBe(
      '/assets/webflow/misc/example-p-500.png 500w, /assets/webflow/misc/example-p-800.png 800w, /assets/webflow/misc/example.png 978w',
    );
  });
});
