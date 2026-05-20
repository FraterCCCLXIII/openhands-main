import {
  OPENHANDS_AUTOMATIONS_GUIDE_URL,
  OPENHANDS_CLOUD_URL,
} from './product-links';

export interface SiteLink {
  name: string;
  to: string;
  external?: boolean;
}

export interface SiteLinkGroup {
  title: string;
  links: SiteLink[];
}

export interface ProductDropdownItem {
  name: string;
  to: string;
  description: string;
  icon: 'agent-canvas' | 'automations' | 'cloud' | 'sdk';
  external?: boolean;
}

export const PRODUCT_DROPDOWN_ITEMS: ProductDropdownItem[] = [
  { name: 'Agent Canvas', to: '/product/agent-canvas', description: 'One workspace. All your agents.', icon: 'agent-canvas' },
  { name: 'Automations', to: OPENHANDS_AUTOMATIONS_GUIDE_URL, description: 'Build it once. Let it run forever.', icon: 'automations', external: true },
  { name: 'Cloud', to: OPENHANDS_CLOUD_URL, description: "Agents that don't stop when you do.", icon: 'cloud', external: true },
  { name: 'SDK', to: '/product/sdk', description: 'Build agents your way.', icon: 'sdk' },
];

export const DESKTOP_NAV_ITEMS: SiteLink[] = [
  { name: 'Product', to: '/product' },
  { name: 'Enterprise', to: '/enterprise' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'Benchmarks', to: 'https://index.openhands.dev/home', external: true },
  { name: 'Community', to: '/community' },
];

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
