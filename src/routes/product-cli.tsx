import type { MetaFunction } from 'react-router';
import { ProductFeaturePage } from '~/components/product-feature-page';
import { PRODUCT_FEATURE_PAGES } from '~/data/product-feature-pages';
import { createSocialPreviewMeta } from '~/utils/seo';

const FAQS = [
  {
    question: 'Is the OpenHands CLI still available?',
    answer:
      'Yes. The CLI remains available for terminal-first workflows, scripting, and headless usage. It is no longer featured in the product dropdown because Agent Canvas is now the recommended starting point for most developers.',
  },
  {
    question: 'When should I use Agent Canvas instead of the CLI?',
    answer:
      'Use Agent Canvas when you want multiple active sessions, a visual workspace, built-in automations, backend switching, or shared team workflows. It gives CLI users the system layer around their agents.',
  },
  {
    question: 'Can the CLI work with ACP-compatible tools?',
    answer:
      'Yes. The CLI can participate in ACP-compatible editor and harness workflows, and Agent Canvas is designed to connect to those same compatible agents.',
  },
  {
    question: 'Will CLI documentation remain available?',
    answer:
      'Yes. Existing CLI documentation remains available for developers who need terminal-specific commands, confirmation modes, and scripting examples.',
  },
  {
    question: 'What should new users install first?',
    answer:
      'New users should start with Agent Canvas, then use the CLI docs when they need terminal-first control or want to wire agents into scripts.',
  },
] as const;

const PAGE = PRODUCT_FEATURE_PAGES.cli;

export const meta: MetaFunction = () =>
  createSocialPreviewMeta({
    title: PAGE.metaTitle,
    description: PAGE.metaDescription,
    pathname: '/product/cli',
  });

export const handle = { hideGlobalFooter: true };

export default function ProductCli() {
  return <ProductFeaturePage page={PAGE} faqs={FAQS} variant='cli' />;
}
