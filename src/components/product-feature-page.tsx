import type { ProductFeaturePageData } from '~/data/product-feature-pages';
import { OverlayLinkButton } from '~/components/overlay-link-button';

export interface ProductPageAction {
  label: string;
  href: string;
  variant?: 'primary' | 'outline';
  screenReaderLabel?: string;
}

export interface ProductFaqItem {
  question: string;
  answer: string;
}

const TABLE_TICK_ICON = '/assets/webflow/icons/691234bd9e72712ffbcf9470_tick.svg';

export const PRODUCT_COMPARISON_ROWS = [
  { label: 'Open-source', values: [true, false, false, false] },
  { label: 'Model-agnostic', values: [true, false, false, true] },
  { label: 'Sandbox runtime', values: [true, true, false, true] },
  { label: 'Self-hosted', values: [true, false, true, false] },
  { label: 'Coding Agent SDK', values: [true, false, true, false] },
] as const;

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ');

const AsciiBackdrop = ({ opacity = 'opacity-[0.12]' }: { opacity?: string }) => (
  <div className={classNames('pointer-events-none absolute inset-0', opacity)}>
    <img
      src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
      alt=''
      className='h-full w-full object-cover'
    />
  </div>
);

const ProductEyebrow = ({ label }: { label: string }) => (
  <div className='inline-flex rounded-[4px] bg-brand-accent px-5 py-2 text-[13px] font-medium leading-none text-brand-fg'>
    {label}
  </div>
);

export const ProductPageActionLink = ({
  href,
  label,
  variant = 'primary',
  className = '',
  screenReaderLabel,
}: ProductPageAction & { className?: string }) => {
  return (
    <OverlayLinkButton
      href={href}
      label={label}
      srLabel={screenReaderLabel}
      variant={variant}
      className={classNames('whitespace-nowrap', className)}
    />
  );
};

const ProductFeatureIntroBand = ({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image?: ProductFeaturePageData['heroImage'];
}) => (
  <section className='relative min-h-[467px] overflow-hidden bg-brand-accent px-6 pb-20 pt-36 lg:px-10'>
    {image ? (
      <img src={image.src} alt={image.alt} className='absolute inset-0 h-full w-full object-cover' />
    ) : (
      <AsciiBackdrop opacity='opacity-[0.14]' />
    )}
    <div className='relative mx-auto max-w-[978px] text-center'>
      <div className='mx-auto max-w-[860px]'>
        <h2 className='text-[30px] font-medium leading-[1.2] tracking-[-0.03em] text-brand-fg lg:text-[32px]'>
          {title}
        </h2>
        <p className='mx-auto mt-5 max-w-[720px] text-[18px] leading-[1.45] text-brand-fg/80'>
          {description}
        </p>
      </div>
    </div>
  </section>
);

const ProductFeatureProofBand = ({
  title,
  description,
  image,
  headingClassName = 'text-white',
}: {
  title: string;
  description: string;
  image?: ProductFeaturePageData['accentImage'];
  headingClassName?: string;
}) => (
  <section className='relative min-h-[571px] overflow-hidden bg-brand-fg px-6 pb-20 pt-36 lg:px-10'>
    {image ? (
      <img src={image.src} alt={image.alt} className='absolute inset-0 h-full w-full object-cover' />
    ) : (
      <div className='pointer-events-none absolute inset-0 opacity-[0.28]'>
        <img
          src='/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png'
          alt=''
          className='h-full w-full object-cover'
        />
      </div>
    )}
    <div className='relative mx-auto max-w-[978px] text-center'>
      <div className='mx-auto max-w-[860px]'>
        <h2 className={classNames('text-[30px] font-medium leading-[1.2] tracking-[-0.03em] lg:text-[32px]', headingClassName)}>
          {title}
        </h2>
        <p className='mx-auto mt-5 max-w-[760px] text-[18px] leading-[1.45] text-[#d6caab]'>
          {description}
        </p>
      </div>
    </div>
  </section>
);

const ProductGuiIntroSection = ({
  image,
  title,
  description,
}: {
  image: ProductFeaturePageData['heroImage'];
  title: string;
  description: string;
}) => (
  <section className='bg-brand-fg px-6 py-16 lg:px-10 lg:py-0'>
    <div className='mx-auto grid max-w-[1260px] gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center'>
      <div className='rounded-[18px] bg-brand-bg p-7 shadow-[0_0_0_1px_rgba(249,240,217,0.08)]'>
        <img src={image.src} alt={image.alt} className='w-full rounded-[8px]' />
      </div>
      <div className='text-brand-bg'>
        <h2 className='text-[34px] font-medium leading-[1.08] tracking-[-0.03em] lg:text-[44px]'>{title}</h2>
        <p className='mt-5 max-w-[500px] text-[18px] leading-[1.45] text-[#d6caab]'>{description}</p>
      </div>
    </div>
  </section>
);

const ProductList = ({ items }: { items: readonly string[] }) => (
  <div className='mt-6 border-t border-brand-fg/15'>
    {items.map((item) => (
      <div key={item} className='border-b border-brand-fg/15 py-4 text-[17px] leading-[1.45] text-brand-fg/80'>
        {item}
      </div>
    ))}
  </div>
);

const ProductImageCard = ({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) => (
  <div className={classNames('rounded-[18px] border border-brand-fg/10 bg-brand-bg p-5 shadow-[0_10px_35px_rgba(34,21,13,0.04)]', className)}>
    <img src={src} alt={alt} className='w-full rounded-[8px]' />
  </div>
);

export const ProductComparisonTable = ({
  dark = false,
  ctaHref,
  ctaLabel,
}: {
  dark?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
}) => {
  const sectionClass = dark ? 'bg-brand-fg text-brand-bg' : 'bg-brand-bg text-brand-fg';
  const headingClass = dark ? 'text-brand-bg' : 'text-brand-fg';
  const cellClass = dark ? 'text-brand-bg/90' : 'text-brand-fg/85';
  const borderClass = dark ? 'border-brand-bg/20' : 'border-brand-fg/12';
  const crossClass = dark ? 'text-brand-bg/55' : 'text-brand-fg/35';

  return (
    <section className={classNames('px-6 py-20 lg:px-10', sectionClass)}>
      <div className='mx-auto max-w-[1260px]'>
        <div className={classNames('mx-auto max-w-[760px] text-center text-[34px] font-medium leading-[1.08] tracking-[-0.03em] lg:text-[44px]', headingClass)}>
          The only open, secure, and scalable agent platform built for real engineering work
        </div>
        <div className='mt-10 overflow-x-auto'>
          <table className='min-w-full border-collapse text-left'>
            <thead>
              <tr className={classNames('border-b text-[13px] uppercase tracking-[0.08em]', borderClass, dark ? 'text-brand-bg/70' : 'text-brand-fg/60')}>
                <th className='py-4 pr-6 font-medium'>Feature</th>
                <th className='px-6 py-4 text-center font-medium'>OpenHands</th>
                <th className='px-6 py-4 text-center font-medium'>Devin</th>
                <th className='px-6 py-4 text-center font-medium'>Claude Code</th>
                <th className='px-6 py-4 text-center font-medium'>Factory</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className={classNames('border-b last:border-b-0', borderClass)}>
                  <td className={classNames('py-4 pr-6 text-[16px] font-medium', cellClass)}>{row.label}</td>
                  {row.values.map((value, index) => (
                    <td key={`${row.label}-${index}`} className='px-6 py-4 text-center'>
                      {value ? (
                        <img src={TABLE_TICK_ICON} alt='' aria-hidden='true' className='mx-auto h-5 w-5' />
                      ) : (
                        <span className={classNames('text-[18px] leading-none', crossClass)}>×</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ctaHref && ctaLabel ? (
          <div className='mt-10 text-center'>
            <ProductPageActionLink
              href={ctaHref}
              label={ctaLabel}
              className={dark ? 'border-transparent bg-[#6f5a4a] text-brand-bg hover:bg-[#816956]' : ''}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
};

export const ProductFaqSection = ({ faqs }: { faqs: readonly ProductFaqItem[] }) => {
  return (
    <section className='bg-brand-bg px-6 py-20 lg:px-10'>
      <div className='mx-auto grid max-w-[1260px] gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16'>
        <div>
          <h2 className='text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-brand-fg lg:text-[44px]'>
            FAQ&apos;s
          </h2>
          <ProductPageActionLink href='/contact' label='Contact us' variant='outline' className='mt-8' />
        </div>
        <div className='border-t border-brand-fg/15'>
          {faqs.map((faq) => (
            <details key={faq.question} className='group border-b border-brand-fg/15 py-4'>
              <summary className='flex cursor-pointer list-none items-start justify-between gap-6 text-[24px] font-medium leading-[1.4] text-brand-fg'>
                <label className='block cursor-pointer'>{faq.question}</label>
                <span className='mt-1 text-[22px] leading-none transition-transform group-open:rotate-45'>+</span>
              </summary>
              <p className='max-w-[680px] pt-4 text-[16px] leading-[1.6] text-brand-fg/75'>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export const ProductPageFooterCta = ({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: readonly ProductPageAction[];
}) => {
  return (
    <section className='relative overflow-hidden bg-brand-accent px-6 py-20 text-center lg:px-10'>
      <AsciiBackdrop opacity='opacity-[0.18]' />
      <div className='relative mx-auto flex max-w-[760px] flex-col items-center gap-6'>
        <div className='text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-brand-fg lg:text-[44px]'>
          {title}
        </div>
        <p className='max-w-[620px] text-[18px] leading-[1.45] text-brand-fg/80'>{description}</p>
        <div className='flex flex-wrap items-center justify-center gap-4'>
          {actions.map((action) => (
            <ProductPageActionLink key={`${action.label}-${action.href}`} {...action} />
          ))}
        </div>
      </div>
    </section>
  );
};

export const ProductFeaturePage = ({
  page,
  faqs,
  variant,
}: {
  page: ProductFeaturePageData;
  faqs: readonly ProductFaqItem[];
  variant: 'cli' | 'gui' | 'sdk';
}) => {
  const isGui = variant === 'gui';
  const comparisonSpacerClass = variant === 'cli' ? 'h-[300px]' : 'h-[84px]';

  return (
    <main className='bg-brand-bg'>
      <section
        className={classNames(
          'relative overflow-hidden bg-brand-bg px-6 pb-16 pt-10 lg:px-10 lg:pt-12',
          isGui ? 'lg:pb-20' : 'lg:pb-[108px]'
        )}
      >
        <AsciiBackdrop />
        <div className='relative mx-auto flex max-w-[860px] flex-col items-center text-center'>
          <ProductEyebrow label={page.eyebrow} />
          <h1 className='mt-8 text-[40px] font-medium leading-[1.08] tracking-[-0.04em] text-brand-fg lg:text-[44px]'>
            {page.heading}
          </h1>
          <p className='mt-4 max-w-[620px] text-[18px] leading-[1.45] text-brand-fg/75'>{page.description}</p>
          <div className='mt-8 flex flex-wrap items-center justify-center gap-4'>
            <ProductPageActionLink
              href={page.primaryCta.href}
              label={page.primaryCta.label}
              screenReaderLabel='Join Slack'
            />
            <ProductPageActionLink
              href={page.secondaryCta.href}
              label={page.secondaryCta.label}
              variant='outline'
            />
          </div>
        </div>
      </section>

      {isGui ? (
        <>
          <ProductGuiIntroSection
            image={page.heroImage}
            title={page.introTitle}
            description={page.introDescription}
          />
          <ProductFeatureProofBand
            title={page.proofTitle}
            description={page.proofDescription}
            image={page.accentImage}
            headingClassName='text-brand-fg'
          />
        </>
      ) : (
        <>
          <ProductFeatureIntroBand
            title={page.introTitle}
            description={page.introDescription}
            image={page.heroImage}
          />
          <ProductFeatureProofBand
            title={page.proofTitle}
            description={page.proofDescription}
            image={page.accentImage}
          />
        </>
      )}

      <section className='bg-brand-bg px-6 py-16 lg:px-10 lg:py-20'>
        <div className='mx-auto grid max-w-[1260px] gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center'>
          <div>
            <h2 className='text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-brand-fg lg:text-[44px]'>
              Key capabilities
            </h2>
            <ProductList items={page.capabilities} />
          </div>
          <ProductImageCard src={page.showcaseImages[0].src} alt={page.showcaseImages[0].alt} />
        </div>
      </section>

      <section className='bg-brand-bg px-6 pb-16 lg:px-10 lg:pb-20'>
        <div className='mx-auto grid max-w-[1260px] gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center'>
          <ProductImageCard src={page.showcaseImages[1].src} alt={page.showcaseImages[1].alt} />
          <div>
            <h2 className='text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-brand-fg lg:text-[44px]'>
              How teams use it
            </h2>
            <ProductList items={page.useCases} />
          </div>
        </div>
      </section>

      <ProductComparisonTable dark ctaHref='https://app.all-hands.dev/' ctaLabel='Try it live' />
      <div className={classNames('bg-brand-fg', comparisonSpacerClass)} aria-hidden='true' />
      <ProductFaqSection faqs={faqs} />
      <ProductPageFooterCta
        title={page.closingTitle}
        description={page.closingDescription}
        actions={[
          page.closingPrimaryCta,
          { ...page.closingSecondaryCta, variant: 'outline' },
        ]}
      />
    </main>
  );
};
