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
    <main data-wf-el='page-main' style={{ display: 'flex', flexDirection: 'column' }}>
      {/*
        Live openhands.dev/product nests the dark "interface cards"
        section inside section-product_hero (look for the two
        consecutive </section> closing tags after the dark u-bg-darkbrown
        block on live's HTML).  Mirroring that structure keeps the
        section count and per-section heights aligned with live.
      */}
      <section data-wf-el='section-product_hero' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px' }} className='relative'>
        <div data-wf-el='asci-wrap' className='pointer-events-auto absolute inset-x-0 top-0 h-screen overflow-hidden' style={{ '--ascii-opacity': '0.12' } as CSSProperties} aria-hidden='true'>
          <ASCIIAnimation className='h-full w-full' />
        </div>
        <div className='relative mx-auto flex max-w-[1238px] flex-col items-center justify-center text-center' style={{ height: '432px' }}>
          <div className='rounded-[4px] bg-brand-accent text-[13px] font-medium leading-none text-brand-fg' style={{ alignItems: 'center', display: 'flex', height: '48px', justifyContent: 'center', marginBottom: '24px', width: '121px' }}>
            Product
          </div>
          <h1 className='fluid-h1 max-w-[932px] text-brand-fg'>
            Build better software with autonomous cloud agent
          </h1>
          <p className='max-w-[560px] fluid-body-lg text-[#5f5f5f]' style={{ marginTop: '10.4px', marginBottom: '20.8px' }}>
            Offload toil, ship faster. OpenHands automates real development tasks with transparency, governance, and choice.
          </p>
          <div className='flex flex-wrap items-center justify-center gap-4' style={{ paddingTop: '32px' }}>
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

        {/* Nested dark interface-cards section — see comment above */}
        <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgb(34, 21, 13)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', marginTop: '0px', minHeight: '1766px' }}>
        <div className='mx-auto flex max-w-[1238px] flex-col' style={{ rowGap: '128px' }}>
          {PRODUCT_SURFACES.map((item, index) => {
            const imageCard = (
              <div data-wf-el='product-list_img_wrap' className='bg-brand-bg' style={{ alignItems: 'center', borderRadius: '16px', borderTop: '1px solid rgb(249, 240, 217)', boxSizing: 'border-box', display: 'flex', height: '450px', justifyContent: 'center', marginLeft: 'auto', marginRight: 'auto', maxWidth: '100%', overflow: 'hidden', width: '619px' }}>
                <img src={item.image} alt='' className='img-block product-list_img' style={{ width: '489px', maxWidth: '100%', height: 'auto', borderRadius: '0px', color: 'rgb(249, 240, 217)', objectFit: 'scale-down' }} />
              </div>
            );

            const textBlock = (
              <div className={index === 1 ? 'lg:pl-[44px]' : 'lg:pr-8'}>
                <h2 className='w-fit section-title text-brand-bg'>
                  {item.title}
                </h2>
                <p className='max-w-[571px] fluid-body-lg text-[#b3a88c]' style={{ marginTop: '24px', marginBottom: '20.8px' }}>
                  {item.description}
                </p>
                <OverlayLinkButton
                  href={item.href}
                  label='Learn more'
                  variant='lightbrown'
                  className='w-fit'
                  wrapperStyle={{ marginTop: '17px' }}
                />
              </div>
            );

            return (
              <div
                key={item.title}
                className='grid lg:grid-cols-2 lg:items-center'
                style={{ minHeight: '450px' }}
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
        </section>
      </section>

      <ProductComparisonTable ctaHref='https://app.all-hands.dev/' ctaLabel='Try it live' />
      {/* Live renders the default closing CTA inside the yellow footer section,
        and the footer section itself is a child of page-main. */}
      <Footer
        standalone
        showSocialLinks
        compactNav
        minHeight={1144}
        marketingCtaPrimary={{ href: 'https://app.all-hands.dev/', label: 'Try it live' }}
        marketingCtaSecondary={{ href: 'https://docs.openhands.dev/overview/introduction', label: 'See developer docs' }}
      />
    </main>
  );
};

export default Product;
