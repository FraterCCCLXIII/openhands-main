import type { ReactNode } from 'react';
import {
  ProductComparisonTable,
  ProductFaqSection,
  ProductFeatureProofBand,
  ProductFeatureShowcaseSection,
} from '~/components/product-feature-page';
import { ProductGuiIntroSection } from '~/components/product-gui-intro-section';
import { GET_OPENHANDS_CTA } from '~/constants/site-shell';
import { PRODUCT_FEATURE_PAGES } from '~/data/product-feature-pages';

const CANVAS_PAGE = PRODUCT_FEATURE_PAGES.gui;

const ArchivedExample = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <section className='border-t border-[rgba(24,24,24,0.12)] py-10'>
    <div className='product-feature-container mx-auto w-full max-w-[1238px] px-5 md:px-10'>
      <p className='mb-2 font-mono text-xs font-normal uppercase tracking-[0.1em] text-[#8a5f45]'>Archived example</p>
      <h2 className='fluid-h4 text-brand-fg' style={{ marginBottom: '8px' }}>
        {title}
      </h2>
      <p className='fluid-body-lg max-w-[760px] text-brand-muted' style={{ marginBottom: '32px' }}>
        {description}
      </p>
    </div>
    {children}
  </section>
);

export function ProductCanvasArchivedSections() {
  return (
    <div data-wf-el='archived-sections' className='product-canvas-archived-sections'>
      <ArchivedExample
        title='Web GUI intro band'
        description='Two-column dark section with framed GUI screenshot and intro copy. Removed from /product/canvas when Agent Canvas sections replaced the legacy Web GUI story.'
      >
        <ProductGuiIntroSection
          image={CANVAS_PAGE.heroImage}
          title={CANVAS_PAGE.introTitle}
          description={CANVAS_PAGE.introDescription}
        />
      </ArchivedExample>

      <ArchivedExample
        title='Trust requires visibility proof band'
        description='ASCII accent background with centered proof copy. Removed from /product/canvas after the canvas-specific sections were added.'
      >
        <ProductFeatureProofBand
          title={CANVAS_PAGE.proofTitle}
          description={CANVAS_PAGE.proofDescription}
          image={CANVAS_PAGE.accentImage}
          headingClassName='text-brand-fg'
          descriptionClassName='text-[#5f5f5f]'
        />
      </ArchivedExample>

      <ArchivedExample
        title='Key capabilities and use cases showcase'
        description='Two-row capabilities/use-cases grid with product screenshots. Removed from /product/canvas; still used on CLI and SDK product pages.'
      >
        <ProductFeatureShowcaseSection
          capabilities={CANVAS_PAGE.capabilities}
          useCases={CANVAS_PAGE.useCases}
          showcaseImages={CANVAS_PAGE.showcaseImages}
          variant='gui'
        />
      </ArchivedExample>

      <ArchivedExample
        title='Product comparison table'
        description='Dark competitor comparison block with Get OpenHands CTA. Removed from /product/canvas; still used on CLI and SDK product pages.'
      >
        <ProductComparisonTable
          dark
          ctaHref={CANVAS_PAGE.comparisonCta?.href ?? GET_OPENHANDS_CTA.href}
          ctaLabel={CANVAS_PAGE.comparisonCta?.label ?? GET_OPENHANDS_CTA.label}
          minHeight={1082}
        />
      </ArchivedExample>

      <ArchivedExample
        title='Legacy Web GUI FAQ'
        description='Two-column FAQ accordion with Contact us CTA. Removed from /product/canvas when the page copy moved to Agent Canvas.'
      >
        <ProductFaqSection faqs={CANVAS_PAGE.faqs} />
      </ArchivedExample>
    </div>
  );
}
