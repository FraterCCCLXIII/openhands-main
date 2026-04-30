import type { Route } from './+types/product';
import {
  ProductComparisonTable,
  ProductPageActionLink,
  ProductPageFooterCta,
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
    <main className='bg-brand-bg pt-[100px]'>
      <section className='relative overflow-hidden bg-brand-bg px-6 pb-16 pt-10 lg:px-10 lg:pb-20 lg:pt-12'>
        <div className='pointer-events-none absolute inset-0 opacity-[0.12]'>
          <img
            src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
            alt=''
            className='h-full w-full object-cover'
          />
        </div>
        <div className='relative mx-auto flex max-w-[860px] flex-col items-center text-center'>
          <div className='inline-flex rounded-[4px] bg-brand-accent px-5 py-2 text-[13px] font-medium leading-none text-brand-fg'>
            Product
          </div>
          <h1 className='mt-8 text-[40px] font-medium leading-[1.08] tracking-[-0.04em] text-brand-fg lg:text-[44px]'>
            Build better software with autonomous cloud agent
          </h1>
          <p className='mt-4 max-w-[640px] text-[18px] leading-[1.45] text-brand-fg/75'>
            Offload toil, ship faster. OpenHands automates real development tasks with transparency, governance, and choice.
          </p>
          <div className='mt-8 flex flex-wrap items-center justify-center gap-4'>
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
      </section>

      <section className='bg-brand-fg px-6 py-16 lg:px-10 lg:py-20'>
        <div className='mx-auto max-w-[1260px] space-y-16 lg:space-y-20'>
          {PRODUCT_SURFACES.map((item, index) => {
            const imageCard = (
              <div className='rounded-[18px] bg-brand-bg p-7 shadow-[0_0_0_1px_rgba(249,240,217,0.08)]'>
                <img src={item.image} alt='' className='w-full rounded-[8px]' />
              </div>
            );

            const textBlock = (
              <div className={index === 1 ? 'lg:pl-8' : 'lg:pr-8'}>
                <h2 className='text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-brand-bg lg:text-[44px]'>
                  {item.title}
                </h2>
                <p className='mt-5 max-w-[460px] text-[18px] leading-[1.45] text-[#d6caab]'>
                  {item.description}
                </p>
                <OverlayLinkButton
                  href={item.href}
                  label='Learn more'
                  variant='lightbrown'
                  className='mt-8 whitespace-nowrap'
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

      <ProductComparisonTable ctaHref='https://app.all-hands.dev/' ctaLabel='Try it live' />
      <ProductPageFooterCta
        title='Building the open standard for autonomous software development.'
        description='OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.'
        actions={[
          { href: 'https://app.all-hands.dev/', label: 'Try it live' },
          {
            href: 'https://docs.openhands.dev/overview/introduction',
            label: 'See developer docs',
            variant: 'outline',
          },
        ]}
      />
    </main>
  );
};

export default Product;
