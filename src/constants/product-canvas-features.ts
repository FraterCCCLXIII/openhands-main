import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Blocks,
  Laptop,
  Plug,
  Workflow,
  Zap,
} from 'lucide-react';

export type ProductCanvasFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const PRODUCT_CANVAS_FEATURES: ProductCanvasFeature[] = [
  {
    title: 'Parallel agents, not single sessions',
    description:
      'Run multiple agents simultaneously, each isolated in its own git worktree. All visible from one interface.',
    icon: Workflow,
  },
  {
    title: 'Automations built in',
    description:
      'Cron and webhook triggers like GitHub, Slack, Jira, are built into the UI. No external orchestrator. Open source backend.',
    icon: Zap,
  },
  {
    title: 'Bring your own agent',
    description:
      'Connects to Claude Code, Codex, or any ACP-compatible harness. Keep your existing subscription and model.',
    icon: Plug,
  },
  {
    title: 'Dockerless by default',
    description:
      "Previously: a new container per conversation. Now: a single agent-server on your laptop. Docker is optional.",
    icon: Laptop,
  },
  {
    title: 'Backend switching in the UI',
    description:
      'Local machine, remote VM, or OpenHands Cloud, switch backends from the header without touching your config.',
    icon: ArrowLeftRight,
  },
  {
    title: 'Customizable via plugins',
    description:
      'Canvas Core ships as a composable component library. Contribute new interfaces and workflows as plugins. Fully open source.',
    icon: Blocks,
  },
];
