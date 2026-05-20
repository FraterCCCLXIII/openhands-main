import type { MetaFunction } from 'react-router';
import { ProductFeaturePage } from '~/components/product-feature-page';
import { PRODUCT_FEATURE_PAGES } from '~/data/product-feature-pages';
import { createSocialPreviewMeta } from '~/utils/seo';

const FAQS = [
  {
    question: 'What is Agent Canvas?',
    answer:
      'Agent Canvas is the local visual workspace for running AI coding agents in parallel. It gives developers one place to connect agents, watch work progress, and turn successful runs into repeatable workflows.',
  },
  {
    question: 'Which agents can I connect?',
    answer:
      'Agent Canvas is built around the open Agent Client Protocol, so you can connect compatible harnesses such as Claude Code, Codex, Gemini CLI, and the OpenHands harness while keeping your existing subscriptions and models.',
  },
  {
    question: 'Does Agent Canvas require Docker?',
    answer:
      'No. The Agent Canvas desktop app and agent server run directly on your machine, with local, VM, and cloud backends available as you need more scale or always-on execution.',
  },
  {
    question: 'How are automations related to Agent Canvas?',
    answer:
      'Automations are built into Agent Canvas. You can define a workflow once, then run it from a schedule or trigger it from engineering events like GitHub pull requests, Slack messages, Jira tickets, CI results, and PagerDuty alerts.',
  },
  {
    question: 'Can teams and enterprises use Agent Canvas?',
    answer:
      'Yes. Individual developers can start locally for free, teams can share automations and cloud-backed runs, and enterprises can add SSO, RBAC, audit logs, budget controls, and self-hosted infrastructure through the Agent Control Plane.',
  },
] as const;

const PAGE = PRODUCT_FEATURE_PAGES.gui;

export const meta: MetaFunction = () =>
  createSocialPreviewMeta({
    title: PAGE.metaTitle,
    description: PAGE.metaDescription,
    pathname: '/product/agent-canvas',
  });

export const handle = { hideGlobalFooter: true };

export default function ProductAgentCanvas() {
  return <ProductFeaturePage page={PAGE} faqs={FAQS} variant='gui' />;
}
