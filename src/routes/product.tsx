import type { Route } from './+types/product';
import { Footer } from '~/components/footer';
import {
  ProductComparisonTable,
  ProductPageActionLink,
} from '~/components/product-feature-page';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { PRODUCT_SURFACES } from '~/constants/product-surfaces';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Product | Autonomous Cloud Coding Agents' },
    {
      name: 'description',
      content:
        'Explore how OpenHands revolutionizes software development with secure, model-agnostic cloud coding agents. Delegate, execute, and review code autonomously.',
    },
    { property: 'og:title', content: 'OpenHands Product | Autonomous Cloud Coding Agents' },
    {
      property: 'og:description',
      content:
        'Explore how OpenHands revolutionizes software development with secure, model-agnostic cloud coding agents. Delegate, execute, and review code autonomously.',
    },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

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
              <div style={{ width: '489px', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                <img src={item.image} alt='' className='img-block product-list_img' style={{ width: '489px', maxWidth: '100%', height: 'auto', borderRadius: '0px', color: 'rgb(249, 240, 217)', objectFit: 'scale-down' }} />
              </div>
            );

            const textBlock = (
              <div className={index === 1 ? 'lg:pl-[44px]' : 'lg:pr-8'}>
                <h2 className='w-fit section-title text-brand-bg'>
                  {item.title}
                </h2>
                <p className='max-w-[571px] fluid-body-lg text-[#b3a88c]' style={{ marginTop: '0px', marginBottom: '20.8px' }}>
                  {item.description}
                </p>
                <OverlayLinkButton
                  href={item.href}
                  label='Learn more'
                  variant='lightbrown'
                  className='mt-8'
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
