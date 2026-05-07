import type { Route } from './+types/product';
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
      <section data-wf-el='section-product_hero' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px' }} className='relative overflow-hidden'>
        <div className='relative mx-auto flex max-w-[860px] flex-col items-center text-center'>
          <div className='inline-flex rounded-[4px] bg-brand-accent px-5 py-2 text-[13px] font-medium leading-none text-brand-fg'>
            Product
          </div>
          <h1 className='mt-6 fluid-h1 text-brand-fg'>
            Build better software with autonomous cloud agent
          </h1>
          <p className='mt-4 max-w-[640px] fluid-body-lg text-[#5f5f5f]'>
            Offload toil, ship faster. OpenHands automates real development tasks with transparency, governance, and choice.
          </p>
          <div className='mt-6 flex flex-wrap items-center justify-center gap-4'>
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
        <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgb(34, 21, 13)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', marginTop: '80px' }}>
        <div className='mx-auto max-w-[1260px] space-y-10 lg:space-y-4'>
          {PRODUCT_SURFACES.map((item, index) => {
            const imageCard = (
              <div style={{ width: '489px', maxWidth: '100%' }}>
                <img src={item.image} alt='' className='img-block product-list_img' style={{ width: '489px', maxWidth: '100%', height: 'auto', borderRadius: '0px', color: 'rgb(249, 240, 217)' }} />
              </div>
            );

            const textBlock = (
              <div className={index === 1 ? 'lg:pl-8' : 'lg:pr-8'}>
                <h2 className='w-fit section-title text-brand-bg'>
                  {item.title}
                </h2>
                <p className='mt-5 max-w-[571px] fluid-body-lg text-[#b3a88c]'>
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
                className='grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center'
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

      <ProductComparisonTable headerColor='rgb(138, 95, 69)' ctaHref='https://app.all-hands.dev/' ctaLabel='Try it live' />
      {/*
        Live /product does NOT have a separate yellow ASCII CTA section
        — the "Building the open standard..." copy is rendered inside
        the global footer (section.u-bg-primary) by FooterMarketingCta.
        Adding ProductPageFooterCta here was a structural divergence.
      */}
    </main>
  );
};

export default Product;
