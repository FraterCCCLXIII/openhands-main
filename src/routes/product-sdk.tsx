import { ProductFeaturePage } from '~/components/product-feature-page';
import { PRODUCT_FEATURE_PAGES, PRODUCT_OG_IMAGE } from '~/data/product-feature-pages';
import type { Route } from './+types/product-sdk';

const page = PRODUCT_FEATURE_PAGES.sdk;

export const meta: Route.MetaFunction = () => [
  { title: page.metaTitle },
  { name: 'description', content: page.metaDescription },
  { property: 'og:title', content: page.metaTitle },
  { property: 'og:description', content: page.metaDescription },
  { property: 'og:image', content: PRODUCT_OG_IMAGE },
  { property: 'og:type', content: 'website' },
];

export default function ProductSDK() {
  return <ProductFeaturePage page={page} />;
}
