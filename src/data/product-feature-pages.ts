import { ASCII_ACCENT_15_IMAGE, ASCII_HOLE_IMAGE } from '~/constants/webflow-assets';

export const PRODUCT_OG_IMAGE =
  'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png';

export const PRODUCT_FEATURE_VARIANTS = ['cli', 'gui', 'sdk'] as const;

export type ProductFeatureVariant = (typeof PRODUCT_FEATURE_VARIANTS)[number];

export interface ProductFeatureFaq {
  question: string;
  answer: string;
}

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
  faqs: ProductFeatureFaq[];
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

const productFeaturePages: Record<ProductFeatureVariant, ProductFeaturePageData> = {
  sdk: {
    pageTitle: 'SDK',
    metaTitle: 'OpenHands SDK | Secure, Scalable Agentic Software Development',
    metaDescription: 'Extend OpenHands with code, not constraints.',
    eyebrow: 'SDK',
    heading: 'Build agents your way.',
    description: 'Extend OpenHands with code, not constraints.',
    heroImage: {
      src: ASCII_HOLE_IMAGE.src,
      alt: ASCII_HOLE_IMAGE.alt,
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
      src: ASCII_ACCENT_15_IMAGE.src,
      alt: ASCII_ACCENT_15_IMAGE.alt,
    },
    proofTitle: 'Solve real edge cases.',
    proofDescription:
      'Closed platforms force you into predefined behaviors. OpenHands gives you primitives, not prescriptions, so you can adapt agents to your codebase, tooling, and governance needs.',
    capabilities: [
      'Programmatic task creation',
      'Custom agent behaviors',
      'Tool and API integrations',
      'Model selection and routing',
      'Fine-grained execution control',
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
    faqs: [
      {
        question: 'What is the OpenHands SDK?',
        answer:
          'The OpenHands SDK is a developer toolkit for building, customizing, and orchestrating AI coding agents. It allows teams to integrate OpenHands capabilities directly into their own systems and workflows.',
      },
      {
        question: 'What is the Large Codebase SDK?',
        answer:
          'The Large Codebase SDK is a specialized component that enables OpenHands to understand and operate on complex codebases. It maps dependencies, sequences changes correctly, and allows multiple agents to work in parallel without conflicts.',
      },
      {
        question: 'How can developers use the OpenHands SDK?',
        answer:
          'Developers can use the SDK to build custom agent workflows, automate engineering processes, and extend OpenHands to fit their specific infrastructure and development needs.',
      },
      {
        question: 'Is the OpenHands SDK model-agnostic?',
        answer:
          'Yes. The SDK is designed to be model-agnostic, allowing teams to use different large language models depending on performance, cost, or compliance requirements.',
      },
      {
        question: 'Who should use the OpenHands SDK?',
        answer:
          'The SDK is best suited for platform teams, infrastructure engineers, and organizations looking to deeply integrate AI-driven development into their systems and scale it across teams.',
      },
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
      screenReaderLabel: 'Join Slack',
    },
    secondaryCta: {
      label: 'Download Local GUI',
      href: 'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup',
    },
    introTitle: 'A collaborative interface for agentic workflows.',
    introDescription:
      'The OpenHands Web GUI gives teams a shared workspace to scope tasks, monitor execution, and review results. It turns autonomous agents into teammates you can understand and trust.',
    accentImage: {
      src: ASCII_HOLE_IMAGE.src,
      alt: ASCII_HOLE_IMAGE.alt,
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
    faqs: [
      {
        question: 'What is the OpenHands GUI?',
        answer:
          'The OpenHands GUI is a web-based interface that provides a visual environment for interacting with AI agents, managing tasks, and monitoring execution across your codebase.',
      },
      {
        question: 'Who is the OpenHands GUI designed for?',
        answer:
          'The GUI is ideal for developers, technical operators, and cross-functional teams, giving them visibility into what agents are doing. The visual interface makes it easy to review changes, debug execution, and collaborate on AI-driven development workflows.',
      },
      {
        question: 'What can I do with the OpenHands GUI?',
        answer:
          'With the GUI, you can launch and monitor agent tasks, review code changes, visualize execution flows, and manage development workflows without needing to use the command line.',
      },
      {
        question: 'How does the GUI help with understanding agent behavior?',
        answer:
          'The GUI provides visibility into agent actions, execution steps, and outcomes, making it easier to audit, debug, and trust AI-driven changes in your codebase.',
      },
      {
        question: 'Can the OpenHands GUI be used in enterprise environments?',
        answer:
          'Yes. The GUI supports secure deployment options and integrates with enterprise infrastructure, making it suitable for teams that require governance, visibility, and collaboration at scale.',
      },
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
      src: ASCII_HOLE_IMAGE.src,
      alt: ASCII_HOLE_IMAGE.alt,
    },
    primaryCta: {
      label: 'Get Started',
      href: 'https://docs.openhands.dev/openhands/usage/cli/installation',
      screenReaderLabel: 'Join Slack',
    },
    secondaryCta: {
      label: 'View CLI Docs',
      href: 'https://docs.openhands.dev/openhands/usage/cli/terminal',
    },
    introTitle: 'A first-class terminal and CLI interface for autonomous agents.',
    introDescription:
      'The OpenHands Terminal / CLI gives developers direct, low-latency control over cloud-based coding agents. Use it interactively from your terminal or run it headlessly from CI, cron jobs, or internal systems.\n\nSame agent. Same runtime. Two modes of control.',
    accentImage: {
      src: ASCII_ACCENT_15_IMAGE.src,
      alt: ASCII_ACCENT_15_IMAGE.alt,
    },
    proofTitle: 'Real autonomy needs observability and repeatability.',
    proofDescription:
      'IDE assistants are fine for small edits. Real agentic work requires visibility into what ran, where it ran, and what changed. OpenHands’ Terminal / CLI lets you see exactly what the agent did, inspect outputs, and re-run tasks deterministically.\n\nNo babysitting. No abstraction leaks.',
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
    faqs: [
      {
        question: 'What is the OpenHands CLI?',
        answer:
          'The OpenHands CLI is built for developers who want to delegate real tasks to agents without leaving their terminal, from refactoring code to running multi-step workflows.',
      },
      {
        question: 'How does the OpenHands CLI improve developer productivity?',
        answer:
          'The CLI enables developers to delegate repetitive or complex tasks to AI agents while staying in their existing workflow. This reduces context switching and allows faster iteration directly from the command line.',
      },
      {
        question: 'Can I use the OpenHands CLI with my existing tools?',
        answer:
          'Yes. The OpenHands CLI integrates with standard developer tools, environments, and workflows, making it easy to adopt without changing your existing setup.',
      },
      {
        question: 'Is the OpenHands CLI suitable for advanced engineering workflows?',
        answer:
          'Yes. The CLI is designed for experienced developers who want fine-grained control over agent behavior, task execution, and system-level operations across their codebase.',
      },
      {
        question: 'Does the OpenHands CLI require cloud connectivity?',
        answer:
          'OpenHands can be deployed in cloud or self-hosted environments, allowing teams to run the CLI in secure, isolated setups depending on their infrastructure requirements.',
      },
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
