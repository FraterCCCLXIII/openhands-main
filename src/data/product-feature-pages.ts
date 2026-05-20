import {
  AGENT_CANVAS_CONNECTION_GUIDE_URL,
  AGENT_CANVAS_DOWNLOAD_URL,
  OPENHANDS_DOCS_URL,
} from '~/constants/product-links';

export const PRODUCT_OG_IMAGE =
  'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png';

export interface ProductFeaturePageData {
  pageTitle: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  heading: string;
  description: string;
  heroImage: {
    src: string;
    alt: string;
  };
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  introTitle: string;
  introDescription: string;
  accentImage: {
    src: string;
    alt: string;
  };
  proofTitle: string;
  proofDescription: string;
  capabilities: string[];
  showcaseImages: Array<{
    src: string;
    alt: string;
  }>;
  useCases: string[];
  closingTitle: string;
  closingDescription: string;
  closingPrimaryCta: {
    label: string;
    href: string;
  };
  closingSecondaryCta: {
    label: string;
    href: string;
  };
}

const productFeaturePages: Record<'sdk' | 'gui' | 'cli', ProductFeaturePageData> = {
  sdk: {
    pageTitle: 'SDK',
    metaTitle: 'OpenHands SDK | Build agents your way',
    metaDescription:
      'Use the OpenHands SDK to build custom agents, internal tooling, and production agent services on top of the same open foundation that powers Agent Canvas.',
    eyebrow: 'SDK',
    heading: 'Build agents your way.',
    description:
      'The open foundation everything else runs on. Go beyond Agent Canvas with custom behaviors, internal tooling, and programmatic control.',
    heroImage: {
      src: '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png',
      alt: 'ASCII art depicting a large black hole with light and particles swirling around it.',
    },
    primaryCta: {
      label: 'Get Started',
      href: 'https://docs.openhands.dev/sdk/getting-started',
    },
    secondaryCta: {
      label: 'See developer docs',
      href: OPENHANDS_DOCS_URL,
    },
    introTitle: 'The open foundation for custom coding agents.',
    introDescription:
      'For teams who want to go beyond Agent Canvas, the OpenHands SDK provides a unified Python API for agents, tools, conversations, and production services.',
    accentImage: {
      src: '/assets/webflow/backgrounds/690b50c95a72e7b17a1412a8_09a6ecb11584c3309a64a00d57130313_ascii-art_(15)_1.svg',
      alt: 'asci art',
    },
    proofTitle: 'Bring your tools, models, and workflows.',
    proofDescription:
      'OpenHands adapts to how your team builds, not the other way around. Swap models, wire in internal APIs, expose custom tools, and keep the same agent primitives from prototype to production.',
    capabilities: [
      'Unified Python API',
      'Ready-to-use tools',
      'Model-agnostic routing',
      'Custom agent behaviors',
      'Production-ready server',
    ],
    showcaseImages: [
      {
        src: '/assets/webflow/misc/699f4b0b80190eeea4ba3eb9_sdk-1.png',
        alt: '',
      },
      {
        src: '/assets/webflow/product/how.png',
        alt: '',
      },
    ],
    useCases: [
      'Build domain-specific agents',
      'Embed agents into internal apps',
      'Create custom orchestration layers',
      'Run services on Docker, Kubernetes, or bare metal',
    ],
    closingTitle: 'Build agents your way.',
    closingDescription: 'Start with the SDK when you need custom agent behavior or internal platform integrations.',
    closingPrimaryCta: {
      label: 'Get Started',
      href: 'https://docs.openhands.dev/sdk/getting-started',
    },
    closingSecondaryCta: {
      label: 'See developer docs',
      href: OPENHANDS_DOCS_URL,
    },
  },
  gui: {
    pageTitle: 'Agent Canvas',
    metaTitle: 'OpenHands Agent Canvas | Run agents, not sessions',
    metaDescription:
      'Download Agent Canvas, the local visual workspace for running AI coding agents in parallel, connecting ACP-compatible agents, and creating automations.',
    eyebrow: 'Agent Canvas',
    heading: 'Run agents. Not sessions.',
    description:
      'Agent Canvas, the new face of OpenHands, is a local, visual workspace for running AI coding agents. Install on your laptop, connect the agents you already use, and start.',
    heroImage: {
      src: '/assets/webflow/misc/6994c3bfa634f5f3966d2150_4c76230966d0d54a446a009e4f4a19c2_gui.png',
      alt: '',
    },
    primaryCta: {
      label: 'Download for free',
      href: AGENT_CANVAS_DOWNLOAD_URL,
    },
    secondaryCta: {
      label: 'Read docs',
      href: AGENT_CANVAS_CONNECTION_GUIDE_URL,
    },
    introTitle: 'One workspace. All your agents.',
    introDescription:
      'Run multiple sessions simultaneously, each on its own branch, and switch between local, VM, and cloud backends without changing interfaces.',
    accentImage: {
      src: '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png',
      alt: 'ASCII art depicting a large black hole with light and particles swirling around it.',
    },
    proofTitle: "One session isn't a system.",
    proofDescription:
      'Claude Code, Codex, and terminal tools are powerful, but they stop at the single-session ceiling. Agent Canvas adds the missing layer: parallel agents, always-on execution, built-in automations, team workflows, and open ACP compatibility.',
    capabilities: [
      'Parallel agents in one view',
      'Connect Claude Code, Codex, Gemini CLI, or OpenHands via ACP',
      'Local-first, cloud-ready backends',
      'Cron-style automations in the UI',
      'GitHub, Slack, Jira, PagerDuty, and CI triggers',
      'Share automations, skills, and plugins across your team',
    ],
    showcaseImages: [
      {
        src: '/assets/webflow/product/gui-2.png',
        alt: '',
      },
      {
        src: '/assets/webflow/product/gui-3.png',
        alt: '',
      },
    ],
    useCases: [
      'Run four agents in parallel, each on its own branch',
      'Keep work running after your laptop closes',
      'Create a Monday morning dependency update cron',
      'Trigger code review when a pull request opens',
      'Turn individual wins into shared team workflows',
    ],
    closingTitle: "Your agents should work when you don't.",
    closingDescription: 'Download Agent Canvas and go from single-session prompts to a fleet of always-on agents. Free, open source, no Docker.',
    closingPrimaryCta: {
      label: 'Download Agent Canvas',
      href: AGENT_CANVAS_DOWNLOAD_URL,
    },
    closingSecondaryCta: {
      label: 'Connection Guide',
      href: AGENT_CANVAS_CONNECTION_GUIDE_URL,
    },
  },
  cli: {
    pageTitle: 'Terminal / CLI',
    metaTitle: 'OpenHands CLI | Terminal access for OpenHands agents',
    metaDescription:
      'The OpenHands CLI remains available for terminal-first workflows, while Agent Canvas is the recommended path for parallel sessions, automations, and always-on agents.',
    eyebrow: 'Terminal / CLI',
    heading: 'The CLI is still here. Agent Canvas is where agents scale.',
    description:
      'Use the CLI when you want terminal-first control. Start with Agent Canvas when you need parallel sessions, automations, cloud backends, and a visual workspace.',
    heroImage: {
      src: '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png',
      alt: 'ASCII art depicting a large black hole with light and particles swirling around it.',
    },
    primaryCta: {
      label: 'Download Agent Canvas',
      href: AGENT_CANVAS_DOWNLOAD_URL,
    },
    secondaryCta: {
      label: 'View CLI Docs',
      href: 'https://docs.openhands.dev/openhands/usage/cli/terminal',
    },
    introTitle: 'A lightweight path for terminal-first developers.',
    introDescription:
      'The CLI remains useful for direct command-line control, scripting, and headless use cases. For the full product experience, we are focusing new workflow investment on Agent Canvas and the open ACP ecosystem.',
    accentImage: {
      src: '/assets/webflow/backgrounds/690b50c95a72e7b17a1412a8_09a6ecb11584c3309a64a00d57130313_ascii-art_(15)_1.svg',
      alt: 'asci art',
    },
    proofTitle: 'Keep the terminal. Add the system layer.',
    proofDescription:
      'Agent Canvas connects to ACP-compatible agents and gives terminal-first users the workspace the CLI alone does not provide: parallel sessions, backend switching, automations, and team sharing.',
    capabilities: [
      'Terminal-first task execution',
      'Scriptable and headless workflows',
      'Use with your favorite IDE via ACP',
      'Confirmation mode for safe local execution',
      'Docs and examples remain available',
      'Upgrade path to Agent Canvas for visual orchestration',
    ],
    showcaseImages: [
      {
        src: '/assets/webflow/misc/699490d1d9729682e0daf0a5_cli.png',
        alt: '',
      },
      {
        src: '/assets/webflow/product/how.png',
        alt: '',
      },
    ],
    useCases: [
      'Run a one-off task from your terminal',
      'Wire agents into scripts and local tooling',
      'Launch ACP-compatible editor workflows',
      'Move repeated work into Agent Canvas automations',
    ],
    closingTitle: 'Ready for more than one session?',
    closingDescription:
      'Download Agent Canvas for the local workspace, parallel agents, and built-in automations. Keep the CLI docs nearby for terminal workflows.',
    closingPrimaryCta: {
      label: 'Download Agent Canvas',
      href: AGENT_CANVAS_DOWNLOAD_URL,
    },
    closingSecondaryCta: {
      label: 'View CLI Docs',
      href: 'https://docs.openhands.dev/openhands/usage/cli/terminal',
    },
  },
};

export const PRODUCT_FEATURE_PAGES = productFeaturePages;
