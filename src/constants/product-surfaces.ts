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
    image: '/assets/webflow/misc/691b30b28b25626f4d315588_CLI.webp',
  },
  {
    title: 'Web GUI',
    subtitle: 'Agentic development, made human.',
    description:
      'Plan, run, and review agent work together in a collaborative UI.',
    href: '/product/gui',
    image: '/assets/webflow/misc/691b30afadf69b956d353513_Cloud.webp',
  },
  {
    title: 'SDK',
    subtitle: 'Build agents your way.',
    description:
      'Create specialized agents, integrate internal tools, and orchestrate complex workflows programmatically.',
    href: '/product/sdk',
    image: '/assets/webflow/misc/691b30aa3c700dcb47a96c00_SDK.webp',
  },
];
