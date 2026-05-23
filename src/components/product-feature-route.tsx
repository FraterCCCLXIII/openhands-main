import type { MetaFunction } from 'react-router';
import { ProductFeaturePage } from '~/components/product-feature-page';
import { PRODUCT_FEATURE_PAGES, type ProductFeatureVariant } from '~/data/product-feature-pages';
import { createSocialPreviewMeta } from '~/utils/seo';

export const PRODUCT_FEATURE_HANDLE = { hideGlobalFooter: true } as const;

export const productFeatureMeta = (variant: ProductFeatureVariant): MetaFunction => ({ location }) => {
  const page = PRODUCT_FEATURE_PAGES[variant];

  return createSocialPreviewMeta({
    title: page.metaTitle,
    description: page.metaDescription,
    pathname: location.pathname,
  });
};

export function ProductFeatureRoute({ variant }: { variant: ProductFeatureVariant }) {
  const page = PRODUCT_FEATURE_PAGES[variant];

  return <ProductFeaturePage page={page} variant={variant} />;
}

export function createProductFeatureRoute(variant: ProductFeatureVariant) {
  const Component = () => <ProductFeatureRoute variant={variant} />;
  Component.displayName = `ProductFeatureRoute(${variant})`;

  return {
    Component,
    handle: PRODUCT_FEATURE_HANDLE,
    meta: productFeatureMeta(variant),
  };
}
