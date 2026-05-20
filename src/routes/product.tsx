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
import {
  AGENT_CANVAS_DOWNLOAD_URL,
  OPENHANDS_DOCS_URL,
} from '~/constants/product-links';
import { createSocialPreviewMeta } from '~/utils/seo';

export const meta: Route.MetaFunction = ({ location }) =>
  createSocialPreviewMeta({
    title: 'OpenHands Product | Agent Canvas, Automations, Cloud, and SDK',
    description:
      'Explore the OpenHands platform: Agent Canvas for local parallel agents, Automations for always-on workflows, Cloud for scale, and the SDK for custom agent builders.',
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
            From a single local agent to an org-wide control plane.
          </h1>
          <p className='max-w-[640px] fluid-body-lg text-[#5f5f5f]' style={{ marginTop: '10.4px', marginBottom: '20.8px' }}>
            OpenHands takes you from your first AI coding session to a fleet of always-on agents running across your organization, without switching interfaces or rebuilding workflows.
          </p>
          <div className='flex flex-wrap items-center justify-center gap-4' style={{ paddingTop: '32px' }}>
            <ProductPageActionLink
              href={AGENT_CANVAS_DOWNLOAD_URL}
              label='Download Agent Canvas'
            />
            <ProductPageActionLink
              href={OPENHANDS_DOCS_URL}
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

      <ProductComparisonTable ctaHref={AGENT_CANVAS_DOWNLOAD_URL} ctaLabel='Download Agent Canvas' />
      {/* Live renders the default closing CTA inside the yellow footer section,
        and the footer section itself is a child of page-main. */}
      <Footer
        standalone
        showSocialLinks
        compactNav
        minHeight={1144}
        marketingCtaPrimary={{ href: AGENT_CANVAS_DOWNLOAD_URL, label: 'Download Agent Canvas' }}
        marketingCtaSecondary={{ href: OPENHANDS_DOCS_URL, label: 'See developer docs' }}
      />
    </main>
  );
};

export default Product;
