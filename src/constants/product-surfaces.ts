export interface ProductSurface {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  image: string;
}

export const PRODUCT_SURFACES: ProductSurface[] = [
  {
    title: 'Terminal / CLI',
    subtitle: 'Agentic power from the command line',
    description:
      'Run, inspect, and automate OpenHands agents directly from the terminal or headlessly in your pipelines with full visibility and control.',
    href: '/product/cli',
    image: '/assets/webflow/misc/699490d1d9729682e0daf0a5_cli.png',
  },
  {
    title: 'Web GUI',
    subtitle: 'Agentic development, made human.',
    description:
      'Plan, run, and review agent work together in a collaborative UI.',
    href: '/product/gui',
    image: '/assets/webflow/misc/6994c3bfa634f5f3966d2150_4c76230966d0d54a446a009e4f4a19c2_gui.png',
  },
  {
    title: 'SDK',
    subtitle: 'Build agents your way.',
    description:
      'Create specialized agents, integrate internal tools, and orchestrate complex workflows programmatically.',
    href: '/product/sdk',
    image: '/assets/webflow/misc/699f4b0b80190eeea4ba3eb9_sdk-1.png',
  },
];
