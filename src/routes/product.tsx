import type { CSSProperties } from 'react';
import type { Route } from './+types/product';
import ASCIIAnimation from '~/components/ascii-animation';
import { Footer } from '~/components/footer';
import {
  ProductComparisonTable,
  ProductPageActionLink,
} from '~/components/product-feature-page';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { PRODUCT_SURFACES } from '~/constants/product-surfaces';
import { createSocialPreviewMeta } from '~/utils/seo';

export const meta: Route.MetaFunction = ({ location }) =>
  createSocialPreviewMeta({
    title: 'OpenHands Product | Autonomous Cloud Coding Agents',
    description:
      'Explore how OpenHands revolutionizes software development with secure, model-agnostic cloud coding agents. Delegate, execute, and review code autonomously.',
    pathname: location.pathname,
  });

export const handle = { hideGlobalFooter: true };

const Product = () => {
  return (
    <main data-wf-el='page-main' className='product-page page-main' style={{ display: 'flex', flexDirection: 'column' }}>
      {/*
        Live openhands.dev/product nests the dark "interface cards"
        section inside section-product_hero (look for the two
        consecutive </section> closing tags after the dark u-bg-darkbrown
        block on live's HTML).  Mirroring that structure keeps the
        section count and per-section heights aligned with live.
      */}
      <section data-wf-el='section-product_hero' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px' }}>
        <div data-wf-el='asci-wrap' className='pointer-events-auto absolute inset-x-0 top-0 h-screen overflow-hidden' style={{ '--ascii-opacity': '0.12', maxHeight: 'var(--product-hero-ascii-max-height)' } as CSSProperties} aria-hidden='true'>
          <div className='h-full w-full overflow-hidden'>
            <ASCIIAnimation className='h-full w-full' />
          </div>
        </div>
        <div data-wf-el='hero' className='relative flex w-full flex-col items-center overflow-hidden' style={{ height: 'var(--product-hero-height)', justifyContent: 'flex-start', textAlign: 'start' }}>
          <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ display: 'block', width: 'var(--product-container-width)' }}>
            <div data-wf-el='hero-content' className='flex flex-col items-center justify-center text-center' style={{ position: 'relative', height: 'var(--product-hero-content-height)', paddingTop: '56px', paddingBottom: '56px' }}>
              <div className='u-mb-sm' style={{ marginBottom: '24px' }}>
                <div data-wf-el='banner' className='bg-brand-accent text-brand-fg' style={{ display: 'block', height: '47.9844px', boxSizing: 'border-box', borderRadius: '6.4px', fontSize: '16px', lineHeight: '22.4px', fontWeight: 400, padding: '0px', textAlign: 'center' }}>
                  <div data-wf-el='banner-wrap' style={{ height: '47.9844px', boxSizing: 'border-box', padding: '12.8px 32px', textAlign: 'center' }}>
                    <div>Product</div>
                  </div>
                </div>
              </div>
              <h1 className='fluid-h1 max-w-[932px] text-brand-fg' style={{ width: 'var(--product-hero-title-width, var(--product-hero-h1-width, auto))' }}>
                Build better software with autonomous cloud agent
              </h1>
              <p data-wf-el='paragraph-lg' className='fluid-body-lg text-[#5f5f5f]' style={{ marginTop: '10.4px', marginBottom: 'var(--product-hero-paragraph-margin-bottom)', maxWidth: '560px', textAlign: 'center' }}>
                Offload toil, ship faster. OpenHands automates real development tasks with transparency, governance, and choice.
              </p>
              <div data-wf-el='hero_btn_wrap' className='flex flex-wrap' style={{ paddingTop: '32px', gap: '8px 16px', maxWidth: '100%', alignItems: 'var(--product-hero-button-align-items, var(--product-hero-btn-align-items, normal))', justifyContent: 'var(--product-hero-button-justify-content, var(--product-hero-btn-justify-content, normal))' }}>
                <ProductPageActionLink
                  href='https://app.all-hands.dev/'
                  label='Try it live'
                  screenReaderLabel='Join Slack'
                />
                <ProductPageActionLink
                  href='https://docs.openhands.dev/overview/introduction'
                  label='See developer docs'
                  variant='outline'
                />
              </div>
            </div>
          </div>
        </div>

        <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgb(34, 21, 13)', color: 'rgb(249, 240, 217)', paddingTop: 'var(--product-section-padding-y)', paddingBottom: 'var(--product-section-padding-y)', paddingLeft: '0px', paddingRight: '0px', marginTop: '0px', position: 'relative' }}>
          <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ display: 'block', color: 'rgb(249, 240, 217)', width: 'var(--product-container-width)' }}>
            <div className='flex flex-col' style={{ rowGap: 'var(--product-surface-row-gap)', marginLeft: 'var(--product-surface-list-margin-x)', marginRight: 'var(--product-surface-list-margin-x)' }}>
            {PRODUCT_SURFACES.map((item, index) => {
              const imageCard = (
                <div style={{ marginLeft: index === 1 ? 'var(--product-image-card-margin-left)' : '0px', order: 'var(--product-image-order)', padding: 'var(--product-image-card-padding)', boxSizing: 'border-box' }}>
                  <div data-wf-el='product-list_img_wrap' className='bg-brand-bg' style={{ alignItems: 'center', borderRadius: '16px', border: '1px solid rgb(179, 168, 140)', boxSizing: 'border-box', color: 'rgb(249, 240, 217)', display: 'flex', height: 'var(--product-image-wrap-height)', justifyContent: 'center', minHeight: 'var(--product-image-wrap-min-height)', overflow: 'hidden', padding: '64px', position: 'relative', width: 'var(--product-image-wrap-width)' }}>
                    <img data-wf-el='product-list_img' src={item.image} srcSet={item.srcSet} sizes='(max-width: 978px) 100vw, 978px' alt='' className='img-block product-list_img' style={{ width: '100%', maxWidth: '100%', height: 'auto', borderRadius: '0px', color: 'rgb(249, 240, 217)', display: 'block', objectFit: 'scale-down' }} />
                  </div>
                </div>
              );

              const textBlock = (
                <div data-wf-el='mobile-order-last' style={{ display: 'flex', flexDirection: 'column', marginLeft: 'var(--product-text-margin-left)', order: 'var(--product-text-order)', position: 'relative', transform: index === 1 ? 'var(--product-webgui-text-transform)' : undefined, width: 'var(--product-text-column-width)', maxWidth: 'var(--product-text-column-max-width, var(--product-text-max-width, none))' }}>
                  <div data-wf-el='content-block' style={{ alignItems: 'flex-start', color: 'rgb(249, 240, 217)', display: 'flex', flexDirection: 'column', gap: '16px', height: 'var(--product-content-height)', justifyContent: 'center', padding: 'var(--product-content-padding)', position: 'relative', width: 'var(--product-content-width)' }}>
                    <h2 className='w-fit section-title text-brand-bg' style={{ marginBottom: 'var(--product-surface-heading-margin-bottom)' }}>
                      {item.title}
                    </h2>
                    <p data-wf-el='paragraph-lg' className='fluid-body-lg text-[#b3a88c]' style={{ marginTop: '0px', marginBottom: 'var(--product-surface-paragraph-margin-bottom, 20.8px)', width: 'var(--product-paragraph-width)' }}>
                      {item.description}
                    </p>
                    <OverlayLinkButton
                      href={item.href}
                      label='Learn more'
                      variant='lightbrown'
                      className='w-fit'
                      wrapperStyle={{ marginTop: '0px' }}
                      wfEl='button'
                      textWfEl='btn-text'
                    />
                  </div>
                </div>
              );

              return (
                <div
                  key={item.title}
                  className='grid lg:grid-cols-[639px_639px] lg:items-center'
                  style={{ minHeight: 'var(--product-surface-card-min-height)', rowGap: 'var(--product-surface-card-row-gap)' }}
                >
                  {index === 1 ? (
                    <>
                      {imageCard}
                      {textBlock}
                    </>
                  ) : (
                    <>
                      {textBlock}
                      {imageCard}
                    </>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        </section>
      </section>

      <ProductComparisonTable ctaHref='https://app.all-hands.dev/' ctaLabel='Try it live' />
      {/* Live renders the default closing CTA inside the yellow footer section,
        and the footer section itself is a child of page-main. */}
      <Footer
        standalone
        showSocialLinks
        compactNav
        compactSpacerHeight={9.188}
        showCopyright
        minHeight={1144}
        marketingCtaPrimary={{ href: 'https://app.all-hands.dev/', label: 'Try it live' }}
        marketingCtaSecondary={{ href: 'https://docs.openhands.dev/overview/introduction', label: 'See developer docs' }}
      />
    </main>
  );
};

export default Product;
