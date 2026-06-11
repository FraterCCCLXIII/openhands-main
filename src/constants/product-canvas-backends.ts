import type { LucideIcon } from 'lucide-react';
import { Cloud, Laptop, Monitor } from 'lucide-react';

export type ProductCanvasBackendCard = {
  label: string;
  title: string;
  description: string;
  tag: string;
  icon: LucideIcon;
  variant: 'light' | 'dark';
};

export const PRODUCT_CANVAS_BACKENDS: ProductCanvasBackendCard[] = [
  {
    label: 'Start here',
    title: 'Local agent-server',
    description:
      'Run the agent-server directly on your laptop. No Docker required. Fast to set up, easy to debug. The default starting point for every developer.',
    tag: 'Free · OSS · default',
    icon: Laptop,
    variant: 'light',
  },
  {
    label: 'Scale up',
    title: 'Self-hosted VM',
    description:
      'Connect Agent Canvas to an agent-server running on a remote VM. Your agents run while your laptop is off. You control the infrastructure.',
    tag: 'Free · self-managed',
    icon: Monitor,
    variant: 'light',
  },
  {
    label: 'Go always-on',
    title: 'OpenHands Cloud',
    description:
      'Always-on cloud agents in isolated sandboxes. One-click integrations. Team sharing. No infrastructure to manage. Same Agent Canvas interface.',
    tag: 'Optional · managed cloud',
    icon: Cloud,
    variant: 'dark',
  },
];
