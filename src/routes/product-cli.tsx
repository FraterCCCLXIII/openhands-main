import type { MetaFunction } from 'react-router';
import { ProductFeaturePage } from '~/components/product-feature-page';
import { PRODUCT_FEATURE_PAGES, PRODUCT_OG_IMAGE } from '~/data/product-feature-pages';

const FAQS = [
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
] as const;

const PAGE = PRODUCT_FEATURE_PAGES.cli;

export const meta: MetaFunction = () => [
  { title: PAGE.metaTitle },
  { name: 'description', content: PAGE.metaDescription },
  { property: 'og:title', content: PAGE.metaTitle },
  { property: 'og:description', content: PAGE.metaDescription },
  { property: 'og:image', content: PRODUCT_OG_IMAGE },
  { property: 'og:type', content: 'website' },
];

export default function ProductCli() {
  return <ProductFeaturePage page={PAGE} faqs={FAQS} variant='cli' />;
}
