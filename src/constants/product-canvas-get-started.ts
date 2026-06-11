import { PRODUCT_CANVAS_ACP_LEARN_MORE_URL } from '~/constants/product-canvas-acp';

export type ProductCanvasGetStartedStep = {
  step: number;
  title: string;
  description: string;
  cta: {
    label: string;
    href: string;
    variant: 'primary' | 'outline';
  };
  footnote?: string;
};

export const PRODUCT_CANVAS_GET_STARTED_STEPS: ProductCanvasGetStartedStep[] = [
  {
    step: 1,
    title: 'Download Agent Canvas',
    description:
      'Install on your laptop (macOS, Linux, or Windows). The agent-server runs directly on your machine. No Docker required.',
    cta: {
      label: 'GitHub Releases',
      href: 'https://github.com/OpenHands/agent-canvas/releases',
      variant: 'primary',
    },
  },
  {
    step: 2,
    title: 'Connect your agent',
    description:
      'Use the connection wizard to hook up Claude Code, Codex, or the OpenHands harness via ACP. Your subscription. Your model. Nothing changes.',
    cta: {
      label: 'Connection Guide',
      href: PRODUCT_CANVAS_ACP_LEARN_MORE_URL,
      variant: 'outline',
    },
    footnote: 'Works with any ACP-compatible harness',
  },
  {
    step: 3,
    title: 'Create your first automation',
    description:
      'Set up a GitHub webhook or Monday morning cron. Your agent handles it while you focus on something harder.',
    cta: {
      label: 'Need Inspiration?',
      href: 'https://docs.openhands.dev/openhands/usage/automations/overview',
      variant: 'outline',
    },
    footnote: 'Runs on local, VM, or cloud backend',
  },
];
