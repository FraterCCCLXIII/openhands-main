export interface SiteLink {
  name: string;
  to: string;
  external?: boolean;
}

export interface SiteLinkGroup {
  title: string;
  links: SiteLink[];
}

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
