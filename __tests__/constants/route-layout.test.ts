import { describe, expect, it } from 'vitest';
import {
  getRouteFooterProps,
  getRouteLayoutConfig,
  ROUTE_PARITY_MEASUREMENTS,
  toFooterProps,
} from '../../src/constants/route-layout';

describe('route layout configuration', () => {
  it('keeps page-wrapper parity heights in one responsive config', () => {
    expect(getRouteLayoutConfig('/manifesto', 375).pageWrapper?.height).toBe(
      ROUTE_PARITY_MEASUREMENTS.pageWrapperHeights.manifestoMobile,
    );
    expect(getRouteLayoutConfig('/manifesto', 1440).pageWrapper?.height).toBe(
      ROUTE_PARITY_MEASUREMENTS.pageWrapperHeights.manifestoDesktop,
    );
    expect(getRouteLayoutConfig('/pricing', 1440).pageWrapper?.height).toBe(
      ROUTE_PARITY_MEASUREMENTS.pageWrapperHeights.pricing,
    );
  });

  it('describes shell and global footer ownership by route', () => {
    expect(getRouteLayoutConfig('/').footer.mode).toBe('shell');
    expect(getRouteLayoutConfig('/about').footer.mode).toBe('shell');
    expect(getRouteLayoutConfig('/privacy').footer.mode).toBe('global');
    expect(getRouteLayoutConfig('/tos').footer.mode).toBe('global');
  });

  it('centralizes global footer props and privacy-specific nudges', () => {
    const defaultFooterProps = toFooterProps(getRouteLayoutConfig('/tos').footer);
    expect(defaultFooterProps).toMatchObject({
      standalone: true,
      showSocialLinks: true,
      minHeight: ROUTE_PARITY_MEASUREMENTS.footerSection.defaultMinHeight,
    });

    const privacyFooterProps = getRouteFooterProps('/privacy');
    expect(privacyFooterProps).toMatchObject({
      standalone: true,
      showSocialLinks: true,
      compactNav: true,
      compactSpacerHeight: ROUTE_PARITY_MEASUREMENTS.footerSpacers.privacyCompact,
      footerContainerNudge: ROUTE_PARITY_MEASUREMENTS.footerSpacers.privacyNudge,
    });
  });

  it('centralizes footer CTA variants for commercial routes', () => {
    expect(getRouteFooterProps('/enterprise')).toMatchObject({
      marketingCtaTitle: 'What comes after Claude Code?',
      marketingCtaPrimary: { href: '/contact', label: 'Book a Demo' },
      compactSpacerHeight: ROUTE_PARITY_MEASUREMENTS.footerSpacers.enterpriseCompact,
    });

    expect(getRouteFooterProps('/pricing')).toMatchObject({
      marketingCtaTitle:
        'Building the open standard for autonomous software development.',
      marketingCtaPrimary: { href: 'https://docs.openhands.dev/overview/quickstart', label: 'Get OpenHands' },
      marketingCtaSecondary: null,
      compactNavSpacerHeight: ROUTE_PARITY_MEASUREMENTS.footerSpacers.pricingCompact,
    });

    expect(getRouteFooterProps('/product/gui')).toMatchObject({
      marketingCtaTitle: 'Bring your team into the loop.',
      compactSpacerHeight: 2,
      footerContainerTransform: 'scaleY(0.99975)',
    });
  });
});
