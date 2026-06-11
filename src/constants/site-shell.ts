export interface SiteLink {
  name: string;
  to: string;
  external?: boolean;
}

export interface SiteLinkGroup {
  title: string;
  links: SiteLink[];
}

export type ProductDropdownIcon = 'canvas' | 'controlPlane';

export interface ProductDropdownItem {
  name: string;
  to: string;
  description: string;
  icon: ProductDropdownIcon;
}

export const PRODUCT_DROPDOWN_ITEMS: ProductDropdownItem[] = [
  {
    name: 'Agent Canvas',
    to: '/product/canvas',
    description: 'One workspace to manage all your agents.',
    icon: 'canvas',
  },
  {
    name: 'Agent Control Plane',
    to: '/enterprise#control-plane',
    description: 'From agents to systems.',
    icon: 'controlPlane',
  },
];

export const HEADER_SDK_URL = 'https://docs.openhands.dev/sdk';
export const HEADER_GET_OPENHANDS_URL = 'https://docs.openhands.dev/overview/quickstart';
/** @deprecated Use {@link GET_OPENHANDS_CTA} — kept for legacy imports. */
export const HEADER_TRY_IT_LIVE_URL = HEADER_GET_OPENHANDS_URL;

export const GET_OPENHANDS_CTA = {
  label: 'Get OpenHands',
  href: HEADER_GET_OPENHANDS_URL,
} as const;

export const FOOTER_COMMUNITY_CTA = {
  label: 'Join The Community',
  href: '/community',
} as const;

export const COMPACT_NAV_LINK_CLASS = 'text-sm font-normal leading-[19.6px]';
export const COMPACT_NAV_LINK_GAP = '1.1cqw';
export const COMPACT_NAV_CTA_PADDING = '0.65em 1.35em';
export const COMPACT_NAV_CTA_FONT_SIZE = '14px';
export const COMPACT_NAV_DROPDOWN_ICON_SIZE = '16px';

export const AGENT_CANVAS_INSTALL_COMMAND = 'npm install -g @openhands/agent-canvas';

export const OPENHANDS_LINKEDIN_URL = 'https://www.linkedin.com/company/103318432/';

export const DESKTOP_NAV_ITEMS: SiteLink[] = [
  { name: 'Product', to: '/product' },
  { name: 'Enterprise', to: '/enterprise' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'Benchmarks', to: 'https://index.openhands.dev/home', external: true },
  { name: 'Community', to: '/community' },
];

/** Center-column nav link (external docs CTA rendered as text, not a header button). */
export const HEADER_CENTER_NAV_LINK: SiteLink = {
  name: 'SDK',
  to: HEADER_SDK_URL,
  external: true,
};

export const RESOURCE_LINK_GROUPS: SiteLinkGroup[] = [
  {
    title: 'Learn',
    links: [
      { name: 'Docs', to: 'https://docs.openhands.dev/', external: true },
      { name: 'Manifesto', to: '/manifesto' },
      { name: 'Blog', to: '/blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'Press', to: '/press' },
      { name: 'Careers', to: 'https://jobs.ashbyhq.com/OpenHands', external: true },
      { name: 'About', to: '/about' },
      { name: 'Contact', to: '/contact' },
    ],
  },
];

export const FOOTER_NAV_ITEMS: SiteLink[] = [
  { name: 'Home', to: '/' },
  { name: 'Product', to: '/product' },
  { name: 'Enterprise', to: '/enterprise' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'About', to: '/about' },
];

export const FOOTER_RESOURCE_LINKS: SiteLink[] = [
  { name: 'Community', to: '/community' },
  { name: 'Manifesto', to: '/manifesto' },
  { name: 'Docs', to: 'https://docs.openhands.dev/', external: true },
  { name: 'Blog', to: '/blog' },
  { name: 'Press', to: '/press' },
  { name: 'Careers', to: 'https://jobs.ashbyhq.com/OpenHands', external: true },
];

export const SIDEBAR_NAV_ITEMS: SiteLink[] = [
  { name: 'Home', to: '/' },
  { name: 'Product', to: '/product' },
  { name: 'Enterprise', to: '/enterprise' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'Community', to: '/community' },
  { name: 'Blog', to: '/blog' },
  { name: 'Manifesto', to: '/manifesto' },
  { name: 'About', to: '/about' },
  { name: 'Contact', to: '/contact' },
  { name: 'Careers', to: 'https://jobs.ashbyhq.com/OpenHands', external: true },
  { name: 'Docs', to: 'https://docs.openhands.dev/', external: true },
];
