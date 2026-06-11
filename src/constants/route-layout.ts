import type { FooterProps } from '~/components/footer';
import { FOOTER_COMMUNITY_CTA, GET_OPENHANDS_CTA } from '~/constants/site-shell';
import { PRODUCT_FEATURE_PAGES } from '~/data/product-feature-pages';
import { normalizePathname } from '~/utils/normalize-pathname';

export type FooterMode = 'global' | 'shell' | 'hidden';
export type FooterCtaVariant =
  | 'default'
  | 'product'
  | 'enterprise'
  | 'pricing'
  | 'whitepaper'
  | 'product-cli'
  | 'product-gui'
  | 'product-sdk';

type ResponsiveString = string | { desktop: string; mobile: string };

type FooterComponentProps = Omit<
  FooterProps,
  | 'marketingCtaTitle'
  | 'marketingCtaDescription'
  | 'marketingCtaPrimary'
  | 'marketingCtaSecondary'
>;

export type RouteFooterConfig = FooterComponentProps & {
  mode: FooterMode;
  cta?: FooterCtaVariant | null;
  shellTrailingSpacerHeight?: number;
};

export type RouteLayoutConfig = {
  footer: RouteFooterConfig;
  pageWrapper?: {
    className?: string;
    height?: ResponsiveString;
  };
  afterGlobalFooterSpacerHeight?: string;
};

export type ResolvedRouteLayoutConfig = Omit<RouteLayoutConfig, 'pageWrapper'> & {
  pageWrapper?: {
    className?: string;
    height?: string;
  };
};

const DEFAULT_GLOBAL_FOOTER_MIN_HEIGHT = 1209;

/**
 * Parity measurements copied from live Webflow-rendered pages.
 * Keep route/footer/page-wrapper magic values here so future parity work has
 * one discoverable source instead of path checks scattered through Root/Footer.
 */
export const ROUTE_PARITY_MEASUREMENTS = {
  footerSection: {
    defaultMinHeight: DEFAULT_GLOBAL_FOOTER_MIN_HEIGHT,
    productIndexMinHeight: 1144,
    productSubpageMinHeight: 1056,
    legacyProductSubpageRootMinHeight: 1071,
    enterpriseMinHeight: 1161,
  },
  footerSpacers: {
    privacyCompact: 9.2,
    privacyNudge: 0.19,
    blogIndexCompact: 9.36,
    blogIndexContainer: 950,
    blogIndexFlowSpacer: 41,
    pricingCompact: 10.4,
    productIndexCompact: 9.188,
    enterpriseCompact: 9.6,
    communityCompact: 10.36,
    pressCompact: 9.1875,
    manifestoMobileCompact: 9.21,
  },
  pageWrapperHeights: {
    manifestoDesktop: '3553.38px',
    manifestoMobile: '4313.75px',
    blogIndex: '3485.38px',
    productIndex: 'var(--product-page-wrapper-height, auto)',
    pricing: 'var(--pricing-page-wrapper-height)',
  },
} as const;

const defaultFooter = (mode: FooterMode): RouteFooterConfig => ({
  mode,
  standalone: true,
  showSocialLinks: true,
  minHeight: DEFAULT_GLOBAL_FOOTER_MIN_HEIGHT,
});

const shellFooter = (overrides: Partial<RouteFooterConfig> = {}): RouteFooterConfig => ({
  mode: 'shell',
  standalone: true,
  compactNav: true,
  compactSpacerHeight: 0,
  showSocialLinks: true,
  ...overrides,
});

const footerCtaVariants = {
  default: {},
  product: {
    marketingCtaPrimary: { href: FOOTER_COMMUNITY_CTA.href, label: FOOTER_COMMUNITY_CTA.label },
    marketingCtaSecondary: {
      href: 'https://docs.openhands.dev/overview/introduction',
      label: 'See developer docs',
    },
  },
  enterprise: {
    marketingCtaTitle: 'What comes after Claude Code?',
    marketingCtaDescription:
      'The teams shipping the most are moving beyond individual agent sessions to governed, automated workflows. Let us show you what that looks like in practice.',
    marketingCtaPrimary: { href: '/contact', label: 'Book a Demo' },
    marketingCtaSecondary: { href: 'https://docs.openhands.dev/sdk', label: 'Build with SDK' },
  },
  pricing: {
    marketingCtaTitle:
      'Building the open standard for autonomous software development.',
    marketingCtaDescription:
      'OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.',
    marketingCtaPrimary: { href: FOOTER_COMMUNITY_CTA.href, label: FOOTER_COMMUNITY_CTA.label },
    marketingCtaSecondary: null,
  },
  whitepaper: {
    marketingCtaTitle: 'Bring your team into the loop.',
    marketingCtaDescription: 'Use the OpenHands Web GUI to collaborate with agents.',
    marketingCtaPrimary: { label: GET_OPENHANDS_CTA.label, href: GET_OPENHANDS_CTA.href },
    marketingCtaSecondary: {
      label: 'Download Local GUI',
      href: 'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup',
    },
  },
  'product-cli': productFeatureCta('cli'),
  'product-gui': productFeatureCta('gui'),
  'product-sdk': productFeatureCta('sdk'),
} satisfies Record<FooterCtaVariant, Partial<FooterProps>>;

const ROUTE_LAYOUTS: Record<string, RouteLayoutConfig> = {
  '/': {
    footer: {
      mode: 'shell',
      compactNav: true,
      showMarketingCta: false,
      showSocialLinks: true,
      showCopyright: true,
      containerWfEl: null,
    },
  },
  '/about': {
    footer: shellFooter({ shellTrailingSpacerHeight: 0 }),
    pageWrapper: { className: 'about-page-wrapper' },
  },
  '/contact': {
    footer: shellFooter({ shellTrailingSpacerHeight: 19 }),
  },
  '/internal/component-examples': {
    footer: defaultFooter('global'),
  },
  '/press': {
    footer: shellFooter({ shellTrailingSpacerHeight: 0 }),
  },
  '/manifesto': {
    footer: shellFooter({ layoutVariant: 'manifesto', shellTrailingSpacerHeight: 0 }),
    pageWrapper: {
      height: {
        desktop: ROUTE_PARITY_MEASUREMENTS.pageWrapperHeights.manifestoDesktop,
        mobile: ROUTE_PARITY_MEASUREMENTS.pageWrapperHeights.manifestoMobile,
      },
    },
  },
  '/blog': {
    footer: shellFooter({
      compactNavSpacerHeight: ROUTE_PARITY_MEASUREMENTS.footerSpacers.blogIndexCompact,
      standaloneContainerHeight: ROUTE_PARITY_MEASUREMENTS.footerSpacers.blogIndexContainer,
      standaloneContainerFlowSpacerHeight: ROUTE_PARITY_MEASUREMENTS.footerSpacers.blogIndexFlowSpacer,
    }),
    pageWrapper: { height: ROUTE_PARITY_MEASUREMENTS.pageWrapperHeights.blogIndex },
  },
  '/blog/:slug': {
    footer: shellFooter(),
  },
  '/community': {
    footer: shellFooter({
      compactNavSpacerHeight: ROUTE_PARITY_MEASUREMENTS.footerSpacers.communityCompact,
      showCopyright: true,
    }),
  },
  '/enterprise': {
    footer: shellFooter({
      cta: 'enterprise',
      showCopyright: true,
      minHeight: ROUTE_PARITY_MEASUREMENTS.footerSection.enterpriseMinHeight,
    }),
  },
  '/pricing': {
    footer: shellFooter({
      cta: 'pricing',
      compactNavSpacerHeight: ROUTE_PARITY_MEASUREMENTS.footerSpacers.pricingCompact,
    }),
    pageWrapper: { height: ROUTE_PARITY_MEASUREMENTS.pageWrapperHeights.pricing },
  },
  '/privacy': {
    footer: {
      ...defaultFooter('global'),
      compactNav: true,
      footerContainerNudge: ROUTE_PARITY_MEASUREMENTS.footerSpacers.privacyNudge,
      minHeight: undefined,
    },
    pageWrapper: { className: 'privacy-page-wrapper' },
    afterGlobalFooterSpacerHeight: '0.03px',
  },
  '/product': {
    footer: shellFooter({
      cta: 'product',
      showCopyright: true,
      minHeight: ROUTE_PARITY_MEASUREMENTS.footerSection.productIndexMinHeight,
    }),
    pageWrapper: { height: ROUTE_PARITY_MEASUREMENTS.pageWrapperHeights.productIndex },
  },
  '/whitepapers/modernize-legacy-systems-with-ai-agents': {
    footer: shellFooter({
      cta: 'whitepaper',
      webflowLayout: true,
      showCopyright: true,
    }),
  },
};

export function getRouteLayoutConfig(pathname: string, viewportWidth = 1024): ResolvedRouteLayoutConfig {
  const normalizedPathname = normalizePathname(pathname);
  const layout =
    ROUTE_LAYOUTS[normalizedPathname] ??
    getDynamicRouteLayout(normalizedPathname) ??
    { footer: defaultFooter('global') };

  return resolveResponsiveLayout(layout, viewportWidth);
}

export function getRouteFooterProps(pathname: string): FooterProps {
  return toFooterProps(getRouteLayoutConfig(pathname).footer);
}

export function toFooterProps(footer: RouteFooterConfig): FooterProps {
  const { mode: _mode, cta = 'default', shellTrailingSpacerHeight: _shellTrailingSpacerHeight, ...footerProps } = footer;

  return {
    ...footerProps,
    ...(cta === null ? { showMarketingCta: false } : footerCtaVariants[cta]),
  };
}

function productFeatureCta(variant: 'cli' | 'gui' | 'sdk'): Partial<FooterProps> {
  const page = PRODUCT_FEATURE_PAGES[variant];
  return {
    marketingCtaTitle: page.closingTitle,
    marketingCtaDescription: page.closingDescription,
    marketingCtaPrimary: page.closingPrimaryCta,
    marketingCtaSecondary: page.closingSecondaryCta,
  };
}

function getDynamicRouteLayout(pathname: string): RouteLayoutConfig | undefined {
  if (pathname.startsWith('/blog/')) {
    return ROUTE_LAYOUTS['/blog/:slug'];
  }

  const productVariant = productFeatureVariantFromPathname(pathname);
  if (productVariant) {
    return {
      footer: shellFooter({
        cta: `product-${productVariant}`,
        showCopyright: true,
      }),
    };
  }

  return undefined;
}

function productFeatureVariantFromPathname(pathname: string): 'cli' | 'gui' | 'sdk' | undefined {
  if (pathname === '/product/cli') return 'cli';
  if (pathname === '/product/canvas' || pathname === '/product/gui') return 'gui';
  if (pathname === '/product/sdk') return 'sdk';
  return undefined;
}

function resolveResponsiveLayout(
  layout: RouteLayoutConfig,
  viewportWidth: number,
): ResolvedRouteLayoutConfig {
  const pageWrapperHeight = resolveResponsiveValue(layout.pageWrapper?.height, viewportWidth);

  return {
    ...layout,
    footer: { ...layout.footer },
    pageWrapper: layout.pageWrapper
      ? {
          ...layout.pageWrapper,
          height: pageWrapperHeight,
        }
      : undefined,
  };
}

function resolveResponsiveValue(value: ResponsiveString | undefined, viewportWidth: number): string | undefined {
  if (!value || typeof value === 'string') return value;
  return viewportWidth < 768 ? value.mobile : value.desktop;
}
