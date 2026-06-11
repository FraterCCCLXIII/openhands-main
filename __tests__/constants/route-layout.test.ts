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
      footerContainerNudge: ROUTE_PARITY_MEASUREMENTS.footerSpacers.privacyNudge,
    });
  });

  it('uses the shared footer everywhere except Agent Canvas custom copy', () => {
    expect(getRouteFooterProps('/enterprise')).toMatchObject({
      showCopyright: true,
      showSocialLinks: true,
      compactSpacerHeight: 0,
    });
    expect(getRouteFooterProps('/enterprise').marketingCtaTitle).toBeUndefined();

    expect(getRouteFooterProps('/pricing')).toMatchObject({
      compactNavSpacerHeight: ROUTE_PARITY_MEASUREMENTS.footerSpacers.pricingCompact,
      showCopyright: true,
    });
    expect(getRouteFooterProps('/pricing').marketingCtaTitle).toBeUndefined();

    expect(getRouteFooterProps('/product/cli').marketingCtaTitle).toBeUndefined();

    expect(getRouteFooterProps('/product/canvas')).toMatchObject({
      marketingCtaTitle: 'Ready to go further?',
      marketingCtaDescription:
        "Agent Canvas is step one. When you're ready, scale into Teams, Enterprise, or build custom agents with the SDK.",
      marketingCtaPrimary: {
        label: 'Download Agent Canvas',
        href: 'https://github.com/OpenHands/agent-canvas/releases',
      },
      marketingCtaSecondary: { label: 'Explore Enterprise', href: '/enterprise' },
      compactSpacerHeight: 0,
    });
  });
});
