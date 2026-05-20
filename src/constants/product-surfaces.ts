import {
  OPENHANDS_AUTOMATIONS_GUIDE_URL,
  OPENHANDS_CLOUD_URL,
} from './product-links';

export interface ProductSurface {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  image: string;
}

export const PRODUCT_SURFACES: ProductSurface[] = [
  {
    title: 'Agent Canvas',
    subtitle: 'One workspace. All your agents.',
    description:
      'A local, visual workspace for running multiple AI coding agents, connecting the agents you already use, and launching work without Docker.',
    href: '/product/agent-canvas',
    image: '/assets/webflow/misc/6994c3bfa634f5f3966d2150_4c76230966d0d54a446a009e4f4a19c2_gui.png',
  },
  {
    title: 'Automations',
    subtitle: 'Build it once. Let it run forever.',
    description:
      'Turn repeated work into workflows that run on a schedule or trigger from GitHub, Slack, Jira, PagerDuty, CI, and more.',
    href: OPENHANDS_AUTOMATIONS_GUIDE_URL,
    image: '/assets/webflow/blog/openhands-enterprise-agent-control-plane/20260506-openhands-enterprise-agent-control-plane-automations.png',
  },
  {
    title: 'OpenHands Cloud',
    subtitle: "Agents that don't stop when you do.",
    description:
      'Always-on cloud agents, integrations, and team sharing in the same interface when your laptop is closed or your team needs more scale.',
    href: OPENHANDS_CLOUD_URL,
    image: '/assets/webflow/misc/691b30afadf69b956d353513_Cloud.webp',
  },
  {
    title: 'SDK',
    subtitle: 'Build agents your way.',
    description:
      'The open foundation for custom agent behaviors, internal tooling, model routing, and programmatic control beyond the Agent Canvas.',
    href: '/product/sdk',
    image: '/assets/webflow/misc/699f4b0b80190eeea4ba3eb9_sdk-1.png',
  },
];
