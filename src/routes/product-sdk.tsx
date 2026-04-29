import type { MetaFunction } from 'react-router';
import { ProductFeaturePage } from '~/components/product-feature-page';
import { PRODUCT_FEATURE_PAGES, PRODUCT_OG_IMAGE } from '~/data/product-feature-pages';

const FAQS = [
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
] as const;

const PAGE = PRODUCT_FEATURE_PAGES.sdk;

export const meta: MetaFunction = () => [
  { title: PAGE.metaTitle },
  { name: 'description', content: PAGE.metaDescription },
  { property: 'og:title', content: PAGE.metaTitle },
  { property: 'og:description', content: PAGE.metaDescription },
  { property: 'og:image', content: PRODUCT_OG_IMAGE },
  { property: 'og:type', content: 'website' },
];

export default function ProductSdk() {
  return <ProductFeaturePage page={PAGE} faqs={FAQS} variant='sdk' />;
}
