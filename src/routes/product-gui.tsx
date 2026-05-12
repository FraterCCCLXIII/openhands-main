import type { MetaFunction } from 'react-router';
import { ProductFeaturePage } from '~/components/product-feature-page';
import { PRODUCT_FEATURE_PAGES, PRODUCT_OG_IMAGE } from '~/data/product-feature-pages';

const FAQS = [
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
] as const;

const PAGE = PRODUCT_FEATURE_PAGES.gui;

export const meta: MetaFunction = () => [
  { title: PAGE.metaTitle },
  { name: 'description', content: PAGE.metaDescription },
  { property: 'og:title', content: PAGE.metaTitle },
  { property: 'og:description', content: PAGE.metaDescription },
  { property: 'og:image', content: PRODUCT_OG_IMAGE },
  { property: 'og:type', content: 'website' },
];

export const handle = { hideGlobalFooter: true };

export default function ProductGui() {
  return <ProductFeaturePage page={PAGE} faqs={FAQS} variant='gui' />;
}
