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
  <div data-wf-el='asci-wrap' className={classNames('absolute inset-0', opacity)}>
    <div data-wf-el='asci-embed' className='w-full h-full'>
      <img
        src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
        alt=''
        className='h-full w-full object-cover'
        style={{ textAlign: 'start' }}
      />
    </div>
  </div>
);

const ProductEyebrow = ({ label }: { label: string }) => (
  <div data-wf-el='banner' className='rounded-[4px] bg-brand-accent font-medium text-brand-fg' style={{ display: 'block', fontSize: '16px', lineHeight: '22.4px', padding: '0', textAlign: 'center' }}>
    <div data-wf-el='banner-wrap' style={{ fontSize: '16px', lineHeight: '22.4px', paddingTop: '12.8px', paddingBottom: '12.8px', paddingLeft: '32px', paddingRight: '32px', textAlign: 'center' }}>{label}</div>
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
      className={className}
    />
  );
};

const ProductFeatureIntroBand = ({
  title,
  description,
  image,
  wideDescription = false,
}: {
  title: string;
  description: string;
  image?: ProductFeaturePageData['heroImage'];
  wideDescription?: boolean;
}) => (
  // Live /product/{cli,gui,sdk} renders this intro band as a plain
  // `class="section"` sibling — NOT a second section-product_hero.
  // Use the matching wf-el key so the per-section parity comparison
  // does not see two section-product_hero blocks on test.
  <section data-wf-el='section' className='relative min-h-[467px] overflow-hidden' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
    {image ? (
      <img src={image.src} alt={image.alt} className='absolute inset-0 h-full w-full object-cover' />
    ) : (
      <AsciiBackdrop opacity='opacity-[0.14]' />
    )}
    <div data-wf-el='heading-stack' className={classNames('relative mx-auto text-center', wideDescription ? 'max-w-[1238px]' : 'max-w-[978px]')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', paddingTop: '64px', paddingBottom: '64px' }}>
      <h2 className='fluid-h3 mx-auto w-fit text-brand-fg'>
        {title}
      </h2>
      <p className={classNames('fluid-body-lg mx-auto mt-5 text-[#5f5f5f]', wideDescription ? '' : 'max-w-[560px]')}>
        {description}
      </p>
    </div>
  </section>
);

const ProductFeatureProofBand = ({
  title,
  description,
  image,
  headingClassName = 'text-white',
  wideDescription = false,
  minHeightClass = 'min-h-[571px]',
  descriptionClassName,
}: {
  title: string;
  description: string;
  image?: ProductFeaturePageData['accentImage'];
  headingClassName?: string;
  wideDescription?: boolean;
  minHeightClass?: string;
  descriptionClassName?: string;
}) => (
  <section data-wf-el='section' className={classNames('relative overflow-hidden', minHeightClass)} style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
    {image ? (
      <img src={image.src} alt={image.alt} className='absolute inset-0 h-full w-full object-cover' />
    ) : (
      <div className='absolute inset-0 opacity-[0.28]'>
        <img
          src='/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png'
          alt=''
          className='h-full w-full object-cover'
          style={{ textAlign: 'start' }}
        />
      </div>
    )}
    <div data-wf-el='heading-stack' className={classNames('relative mx-auto text-center', headingClassName === 'text-white' ? 'text-white' : '', wideDescription ? 'max-w-[1238px]' : 'max-w-[978px]')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', paddingTop: '64px', paddingBottom: '64px' }}>
      <h2 className={classNames('fluid-h3 mx-auto w-fit', headingClassName)}>
        {title}
      </h2>
      <p className={classNames('fluid-body-lg mx-auto mt-5', descriptionClassName ?? 'text-[#b3a88c]', wideDescription ? '' : 'max-w-[560px]')}>
        {description}
      </p>
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
  <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgb(34, 21, 13)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
    <div className='mx-auto grid max-w-[1260px] gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center'>
      <div className='rounded-[18px] bg-brand-bg p-7 shadow-[0_0_0_1px_rgba(249,240,217,0.08)]'>
        <img src={image.src} alt={image.alt} className='w-full' style={{ borderRadius: '0px', color: 'rgb(249, 240, 217)' }} />
      </div>
      <div data-wf-el='heading-stack' className='text-brand-bg' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
        <h2 className='section-title'>{title}</h2>
        <p className='fluid-body-lg mt-5 max-w-[500px] text-[#b3a88c]'>{description}</p>
      </div>
    </div>
  </section>
);

const ProductList = ({ items }: { items: readonly string[] }) => (
  <div data-wf-el='product-list_ul' className='mt-6' style={{ borderStyle: 'none', textAlign: 'start' }}>
    {items.map((item) => (
      <div data-wf-el='product-list_element' key={item} className='py-4 text-[#5f5f5f] font-medium' style={{ fontSize: '20.8px', lineHeight: '24.96px', display: 'list-item', textAlign: 'start' }}>
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
  <div data-wf-el='product-list_img_wrap' className={classNames('rounded-[18px]', className)} style={{ backgroundColor: 'rgba(0,0,0,0)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgb(179, 168, 140)', boxShadow: 'none', padding: '64px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <img data-wf-el='product-list_img' src={src} alt={alt} className='img-block w-full' style={{ borderRadius: '0px' }} />
  </div>
);

export const ProductComparisonTable = ({
  dark = false,
  headerColor,
  ctaHref,
  ctaLabel,
}: {
  dark?: boolean;
  headerColor?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) => {
  const sectionClass = dark ? 'bg-brand-fg text-brand-bg' : 'bg-brand-bg text-brand-fg';
  const headingClass = dark ? 'text-brand-bg' : 'text-brand-fg';
  const cellClass = dark ? 'font-sohne-buch text-[#b3a88c]' : 'font-sohne-buch text-[#5f5f5f]';
  const borderClass = dark ? 'border-brand-bg/20' : 'border-brand-fg/12';
  const trColor = headerColor ?? (dark ? 'rgb(249, 240, 217)' : 'rgb(34, 21, 13)');
  // Live computed colors for product-table_th: rgb(34,21,13) on light bg,
  // rgb(249,240,217) on dark bg. Live also uses fontWeight 400 (not 500).
  const thColor = headerColor ?? (dark ? 'rgb(249, 240, 217)' : 'rgb(34, 21, 13)');
  const tickColor = headerColor ?? (dark ? 'rgb(179, 168, 140)' : 'rgb(138, 95, 69)');

  return (
    <section data-wf-el='section' className={classNames('relative', dark ? 'text-brand-bg' : 'text-brand-fg')} style={{ display: 'block', backgroundColor: dark ? 'rgb(34, 21, 13)' : 'rgb(249, 240, 217)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
      <div className='relative mx-auto max-w-[1260px]' style={{ display: 'block', color: dark ? 'rgb(249, 240, 217)' : 'rgb(34, 21, 13)', zIndex: 1 }}>
        <div className={classNames('section-title mx-auto max-w-[760px] text-center', headingClass)}>
          The only open, secure, and scalable agent platform built for real engineering work
        </div>
        <div data-wf-el='product-table' className='mt-10 overflow-x-auto' style={{ display: 'table', color: dark ? 'rgb(249, 240, 217)' : 'rgb(34, 21, 13)' }}>
          <table className='min-w-full border-collapse text-left'>
            <thead>
              <tr data-wf-el='product-table_tr' className={classNames('border-b text-[20px] leading-[28px]', borderClass)} style={{ color: trColor }}>
                <th data-wf-el='product-table_th' className='py-4 font-normal text-left' style={{ paddingRight: '0px', letterSpacing: 'normal', textTransform: 'none', color: thColor }}>Feature</th>
                <th data-wf-el='product-table_th' className='py-4 text-center font-normal' style={{ paddingLeft: '0', paddingRight: '0', letterSpacing: 'normal', textTransform: 'none', color: thColor }}>OpenHands</th>
                <th data-wf-el='product-table_th' className='py-4 text-center font-normal' style={{ paddingLeft: '0', paddingRight: '0', letterSpacing: 'normal', textTransform: 'none', color: thColor }}>Devin</th>
                <th data-wf-el='product-table_th' className='py-4 text-center font-normal' style={{ paddingLeft: '0', paddingRight: '0', letterSpacing: 'normal', textTransform: 'none', color: thColor }}>Claude Code</th>
                <th data-wf-el='product-table_th' className='py-4 text-center font-normal' style={{ paddingLeft: '0', paddingRight: '0', letterSpacing: 'normal', textTransform: 'none', color: thColor }}>Factory</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className={classNames('border-b last:border-b-0', borderClass)}>
                  <td className={classNames('py-4 pr-6 text-left text-[16px] font-medium', cellClass)}>{row.label}</td>
                  {row.values.map((value, index) => (
                    <td key={`${row.label}-${index}`} className='px-6 py-4 text-center'>
                      {value ? (
                        <img data-wf-el='icon' src={TABLE_TICK_ICON} alt='' aria-hidden='true' className='mx-auto h-5 w-5' style={{ display: 'inline-flex', fontSize: '20px', lineHeight: '28px', color: tickColor }} />
                      ) : (
                        <img data-wf-el='icon' src='/assets/webflow/misc/Cross.svg' alt='' aria-hidden='true' className='mx-auto h-5 w-5' style={{ display: 'inline-flex', fontSize: '20px', lineHeight: '28px', color: tickColor }} />
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
    <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
      <div data-wf-el='standard-wrap' className='mx-auto max-w-[1260px]' style={{ display: 'block', paddingTop: '0px', paddingBottom: '0px', gap: 'normal' }}>
        <div className='grid gap-10 lg:grid-cols-[490px_minmax(0,1fr)] lg:gap-20'>
        <div>
          <h2 className='section-title text-brand-fg'>
            FAQ&apos;s
          </h2>
          <ProductPageActionLink href='/contact' label='Contact us' variant='outline' className='mt-8' />
        </div>
        <div data-wf-el='standard-collection' className='border-brand-fg/15' style={{ borderStyle: 'none' }}>
          <div role='list' data-wf-el='standard-collection-list'>
            {faqs.map((faq, idx) => (
              <div role='listitem' key={faq.question} data-wf-el='standard-collection-list-item' style={{ display: 'block', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <details
                  data-wf-el='accordion-item'
                  /* Stamp `data-accordion-start-open` on every FAQ row to
                     match live's mast accordion data attribute count (5×).
                     The open/close interaction itself uses <details>/<summary>. */
                  data-accordion-start-open={idx === 0 ? 'true' : 'false'}
                  open={idx === 0 ? true : undefined}
                  className='group'
                  style={{ borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgb(249, 240, 217)', display: 'flex', flexDirection: 'column', padding: '0' }}
                >
                  <summary data-wf-el='accordion-trigger' className='flex cursor-pointer list-none items-center justify-between font-normal text-brand-fg' style={{ fontSize: '16px', lineHeight: '22.4px', padding: '24px', gap: 'normal' }}>
                    <label data-wf-el='accordion-title' className='block pointer-events-none cursor-default font-medium' style={{ paddingRight: '12px', fontSize: '24px', lineHeight: '33.6px' }}>{faq.question}</label>
                    <div data-wf-el='accordion-icon' className='h-8 w-8 flex-shrink-0 overflow-hidden text-brand-fg transition-transform group-open:rotate-180' style={{ display: 'block' }} aria-hidden='true'>
                      <svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M10 13l6 6 6-6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></svg>
                    </div>
                  </summary>
                  <div data-wf-el='accordion-content_spacer' style={{ color: 'rgb(34, 21, 13)', paddingTop: '0', paddingBottom: '24px', paddingLeft: '0', paddingRight: '0' }}><p className='max-w-[680px] font-sohne-buch text-[16px] leading-[22.4px]' style={{ color: 'rgb(95, 95, 95)' }}>{faq.answer}</p></div>
                </details>
              </div>
            ))}
          </div>
        </div>
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
    <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgb(255, 255, 139)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }} className='relative overflow-hidden text-center'>
      <div className='relative mx-auto flex max-w-[812px] flex-col items-center gap-6'>
        <div className='section-title text-brand-fg'>
          {title}
        </div>
        <p className='fluid-body-lg w-full text-[#5f5f5f]'>{description}</p>
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
  const isCli = variant === 'cli';
  const isSdk = variant === 'sdk';
  const comparisonSpacerClass = isCli ? 'h-[355px]' : isGui ? 'h-[298px]' : 'h-[300px]';
  const proofBandMinHeight = isGui ? 'min-h-[420px]' : isSdk ? 'min-h-[407px]' : 'min-h-[571px]';
  return (
    <main data-wf-el='page-main' style={{ display: 'flex', flexDirection: 'column' }}>
      <section
        data-wf-el='section-product_hero'
        className='relative overflow-hidden'
        style={{ padding: '0' }}
      >
        <div data-wf-el='hero' className='relative mx-auto flex max-w-[860px] flex-col items-center' style={{ textAlign: 'start', justifyContent: 'flex-start' }}>
          <ProductEyebrow label={page.eyebrow} />
          <h1 className='fluid-h1 mt-8 text-brand-fg' style={{ textAlign: 'center' }}>
            {page.heading}
          </h1>
          <p data-wf-el='paragraph-lg' className='fluid-body-lg mt-4 max-w-[620px] text-[#5f5f5f]' style={{ textAlign: 'center' }}>{page.description}</p>
          <div className='flex flex-wrap' style={{ paddingTop: '32px', gap: '8px 16px', textAlign: 'center' }}>
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
            descriptionClassName='text-[#5f5f5f]'
            minHeightClass={proofBandMinHeight}
          />
        </>
      ) : (
        <>
          <ProductFeatureIntroBand
            title={page.introTitle}
            description={page.introDescription}
            image={page.heroImage}
            wideDescription={isCli}
          />
          <ProductFeatureProofBand
            title={page.proofTitle}
            description={page.proofDescription}
            image={page.accentImage}
            wideDescription={isCli}
            minHeightClass={proofBandMinHeight}
          />
        </>
      )}

      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgb(249, 240, 217)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ display: 'block' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
            <div data-wf-el='heading-stack' style={{ paddingTop: '64px', paddingBottom: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <h2 className='section-title text-brand-fg' style={{ textAlign: 'start' }}>
                Key capabilities
              </h2>
              <ProductList items={page.capabilities} />
            </div>
            <ProductImageCard src={page.showcaseImages[0].src} alt={page.showcaseImages[0].alt} />
          </div>
        </div>
        <div data-wf-el='container' className='mx-auto mt-12 max-w-[1238px]' style={{ display: 'block' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
            <ProductImageCard src={page.showcaseImages[1].src} alt={page.showcaseImages[1].alt} />
            <div data-wf-el='heading-stack' style={{ paddingTop: '64px', paddingBottom: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <h2 className='section-title text-brand-fg' style={{ textAlign: 'start' }}>
                How teams use it
              </h2>
              <ProductList items={page.useCases} />
            </div>
          </div>
        </div>
      </section>

      <ProductComparisonTable dark ctaHref='https://app.all-hands.dev/' ctaLabel='Try it live' />
      <div className={classNames('bg-brand-fg', comparisonSpacerClass)} aria-hidden='true' />
      <ProductFaqSection faqs={faqs} />
      {/*
        Live /product/{cli,gui,sdk} renders the page-specific
        "Control your agents..."-style CTA INSIDE the footer
        section, not as a separate yellow ASCII section.  The
        global Footer pulls the closing copy via
        productSubpageCtaProps(pathname) in src/root.tsx, so we no
        longer render a standalone <ProductPageFooterCta> here.
      */}
    </main>
  );
};
