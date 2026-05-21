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
    screenReaderLabel?: string;
  };
  secondaryCta: {
    label: string;
    href: string;
    screenReaderLabel?: string;
  };
  comparisonCta?: {
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
    metaTitle: 'OpenHands SDK | Secure, Scalable Agentic Software Development',
    metaDescription: 'Extend OpenHands with code, not constraints.',
    eyebrow: 'SDK',
    heading: 'Build agents your way.',
    description: 'Extend OpenHands with code, not constraints.',
    heroImage: {
      src: '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png',
      alt: 'ASCII art depicting a large black hole with light and particles swirling around it.',
    },
    primaryCta: {
      label: 'View SDK Doc',
      href: 'https://docs.openhands.dev/sdk',
      screenReaderLabel: 'Join Slack',
    },
    secondaryCta: {
      label: 'Contact Us',
      href: '/contact',
    },
    comparisonCta: {
      label: 'Try it live',
      href: 'https://app.all-hands.dev/',
    },
    introTitle: 'An open SDK for building custom agents and workflows.',
    introDescription:
      'The OpenHands SDK lets teams create specialized agents, integrate internal tools, and orchestrate complex workflows programmatically.',
    accentImage: {
      src: '/assets/webflow/backgrounds/690b50c95a72e7b17a1412a8_09a6ecb11584c3309a64a00d57130313_ascii-art_(15)_1.svg',
      alt: 'asci art',
    },
    proofTitle: 'Solve real edge cases.',
    proofDescription:
      'Closed platforms force you into predefined behaviors. OpenHands gives you primitives, not prescriptions, so you can adapt agents to your codebase, tooling, and governance needs.',
    capabilities: [
      'Programmatic task creation',
      'Tool and API integrations',
      'Model selection and routing',
      'Fine-grained execution control',
      'Custom agent behaviors',
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
      'Integrate agents into your apps',
      'Create internal AI platforms',
      'Extend OpenHands beyond defaults',
    ],
    closingTitle: 'Turn OpenHands into your agent platform.',
    closingDescription: 'Start building with the SDK.',
    closingPrimaryCta: {
      label: 'Get Started',
      href: 'https://docs.openhands.dev/sdk/getting-started',
    },
    closingSecondaryCta: {
      label: 'View SDK Docs',
      href: 'https://docs.openhands.dev/sdk',
    },
  },
  gui: {
    pageTitle: 'Web GUI',
    metaTitle: 'OpenHands Web GUI | Secure, Scalable Agentic Software Development',
    metaDescription: 'Plan, run, and review agent work together in a collaborative UI.',
    eyebrow: 'Web GUI',
    heading: 'Agentic development, made human.',
    description: 'Plan, run, and review agent work together in a collaborative UI.',
    heroImage: {
      src: '/assets/webflow/misc/6994c3bfa634f5f3966d2150_4c76230966d0d54a446a009e4f4a19c2_gui.png',
      alt: '',
    },
    primaryCta: {
      label: 'Try it live',
      href: 'https://app.all-hands.dev/',
    },
    secondaryCta: {
      label: 'Download Local GUI',
      href: 'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup',
    },
    introTitle: 'A collaborative interface for agentic workflows.',
    introDescription:
      'The OpenHands Web GUI gives teams a shared workspace to scope tasks, monitor execution, and review results. It turns autonomous agents into teammates you can understand and trust.',
    accentImage: {
      src: '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png',
      alt: 'ASCII art depicting a large black hole with light and particles swirling around it.',
    },
    proofTitle: 'Trust requires visibility.',
    proofDescription:
      'Enterprises don’t adopt black boxes. The GUI makes agent behavior transparent, reviewable, and auditable so teams feel confident delegating real work.',
    capabilities: [
      'Generate technical plans and PRDs',
      'Parallelize multiple agent runs',
      'Review diffs and code artifacts',
      'Share conversations with teammates',
      'Run agents in secure sandboxes',
      'Use with Slack, Jira, GitHub, and more',
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
      'Break epics into agent-sized tasks',
      'Review PRs generated by agents',
      'Track productivity gains across teams',
      'Enable safe rollout beyond power users',
    ],
    closingTitle: 'Bring your team into the loop.',
    closingDescription: 'Use the OpenHands Web GUI to collaborate with agents.',
    closingPrimaryCta: {
      label: 'Try it live',
      href: 'https://app.all-hands.dev/',
    },
    closingSecondaryCta: {
      label: 'Download Local GUI',
      href: 'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup',
    },
  },
  cli: {
    pageTitle: 'Terminal / CLI',
    metaTitle: 'OpenHands CLI | Secure, Scalable Agentic Software Development',
    metaDescription:
      'Run, inspect, and automate OpenHands agents directly from the terminal or headlessly in your pipelines with full visibility and control.',
    eyebrow: 'Terminal / CLI',
    heading: 'Agentic power from the command line.',
    description:
      'Run, inspect, and automate OpenHands agents directly from the terminal or headlessly in your pipelines with full visibility and control.',
    heroImage: {
      src: '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png',
      alt: 'ASCII art depicting a large black hole with light and particles swirling around it.',
    },
    primaryCta: {
      label: 'Get Started',
      href: 'https://docs.openhands.dev/openhands/usage/cli/installation',
    },
    secondaryCta: {
      label: 'View CLI Docs',
      href: 'https://docs.openhands.dev/openhands/usage/cli/terminal',
    },
    introTitle: 'A first-class terminal and CLI interface for autonomous agents.',
    introDescription:
      'The OpenHands Terminal / CLI gives developers direct, low-latency control over cloud-based coding agents. Use it interactively from your terminal or run it headlessly from CI, cron jobs, or internal systems.\nSame agent. Same runtime. Two modes of control.',
    accentImage: {
      src: '/assets/webflow/backgrounds/690b50c95a72e7b17a1412a8_09a6ecb11584c3309a64a00d57130313_ascii-art_(15)_1.svg',
      alt: 'asci art',
    },
    proofTitle: 'Real autonomy needs observability and repeatability.',
    proofDescription:
      'IDE assistants are fine for small edits. Real agentic work requires visibility into what ran, where it ran, and what changed. OpenHands’ Terminal / CLI lets you see exactly what the agent did, inspect outputs, and re-run tasks deterministically.\nNo babysitting. No abstraction leaks.',
    capabilities: [
      'Intuitive and powerful Terminal UX',
      'Save and resume conversations',
      'Use with your favorite IDE via ACP',
      'Headless mode for CI/CD and background tasks',
      'Confirmation mode for safe, local execution',
      'Seamlessly integrates with OpenHands Cloud',
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
      'Fix bugs before standup',
      'Run repo-wide maintenance and refactors',
      'Trigger agents from CI pipelines',
      'Upgrade dependencies nightly',
      'Remediate vulnerabilities before merge',
      'Automate linting and test cleanup',
    ],
    closingTitle: 'Control your agents like real infrastructure.',
    closingDescription:
      'Run OpenHands from the terminal or automate it end to end with the CLI.',
    closingPrimaryCta: {
      label: 'Get Started',
      href: 'https://docs.openhands.dev/openhands/usage/cli/installation',
    },
    closingSecondaryCta: {
      label: 'View CLI Docs',
      href: 'https://docs.openhands.dev/openhands/usage/cli/terminal',
    },
  },
};

export const PRODUCT_FEATURE_PAGES = productFeaturePages;
