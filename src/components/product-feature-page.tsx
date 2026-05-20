import { Fragment, type CSSProperties } from 'react';
import type { ProductFeaturePageData } from '~/data/product-feature-pages';
import { Footer } from '~/components/footer';
import ASCIIAnimation from '~/components/ascii-animation';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { AGENT_CANVAS_DOWNLOAD_URL } from '~/constants/product-links';

export interface ProductPageAction {
  label: string;
  href: string;
  variant?: 'primary' | 'outline' | 'lightbrown';
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

const asciiOpacityValue = (opacityClass: string) => opacityClass.match(/opacity-\[([\d.]+)\]/)?.[1] || '0.12';

const AsciiBackdrop = ({ opacity = 'opacity-[0.12]' }: { opacity?: string }) => (
  <div data-wf-el='asci-wrap' className='absolute inset-0' style={{ '--ascii-opacity': asciiOpacityValue(opacity) } as CSSProperties}>
    <ASCIIAnimation className='h-full w-full' />
  </div>
);

const ProductEyebrow = ({ label }: { label: string }) => (
  <div data-wf-el='banner' className='rounded-[4px] bg-brand-accent font-medium text-brand-fg' style={{ display: 'block', fontSize: '16px', lineHeight: '22.4px', marginBottom: '24px', padding: '0', textAlign: 'center' }}>
    <div data-wf-el='banner-wrap' style={{ fontSize: '16px', lineHeight: '22.4px', paddingTop: '12.8px', paddingBottom: '12.8px', paddingLeft: '32px', paddingRight: '32px', textAlign: 'center' }}>{label}</div>
  </div>
);

export const ProductPageActionLink = ({
  href,
  label,
  variant = 'primary',
  className = '',
  screenReaderLabel,
  wrapperStyle,
}: ProductPageAction & { className?: string; wrapperStyle?: React.CSSProperties }) => {
  return (
    <OverlayLinkButton
      href={href}
      label={label}
      srLabel={screenReaderLabel}
      variant={variant}
      className={className}
      wrapperStyle={wrapperStyle}
    />
  );
};

const renderTextWithBreaks = (text: string) =>
  text.split('\n').map((part, index) => (
    <Fragment key={index}>{index > 0 ? <br /> : null}{part}</Fragment>
  ));

const ProductFeatureIntroBand = ({
  title,
  description,
  image,
  wideDescription = false,
  minHeightClass = 'min-h-[467px]',
}: {
  title: string;
  description: string;
  image?: ProductFeaturePageData['heroImage'];
  wideDescription?: boolean;
  minHeightClass?: string;
}) => (
  // Live /product/{cli,gui,sdk} renders this intro band as a plain
  // `class="section"` sibling — NOT a second section-product_hero.
  // Use the matching wf-el key so the per-section parity comparison
  // does not see two section-product_hero blocks on test.
  <section data-wf-el='section' className={classNames('relative', minHeightClass)} style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
    <div className='absolute inset-0 bg-brand-accent' aria-hidden='true' />
    {/* Live's `.background-image` IMG always computes
     * `position:static; display:inline-block` — the absolute layer is
     * the wrapping div. Match that on both branches. */}
    <div className='absolute inset-0'>
      {image ? (
        <img
          src={image.src}
          alt={image.alt}
          className='h-full w-full object-cover'
          style={{ position: 'static', display: 'inline-block' }}
        />
      ) : (
        <AsciiBackdrop opacity='opacity-[0.14]' />
      )}
    </div>
    <div data-wf-el='heading-stack' className={classNames('relative mx-auto text-center', wideDescription ? 'max-w-[1238px]' : 'max-w-[978px]')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', paddingTop: '64px', paddingBottom: '64px' }}>
      <h2 className='fluid-h3 text-brand-fg' style={{ textAlign: 'center' }}>
        {title}
      </h2>
      <p className={classNames('fluid-body-lg text-[#5f5f5f]', wideDescription ? '' : 'max-w-[560px]')} style={{ marginTop: '10.4px', marginBottom: '20.8px', marginLeft: '0px', marginRight: '0px', ...(wideDescription ? { minHeight: '99.812px' } : {}) }}>
        {renderTextWithBreaks(description)}
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
  <section data-wf-el='section' className={classNames('relative', minHeightClass)} style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
    <div className='absolute inset-0 bg-brand-fg' aria-hidden='true' />
    {/* Live's `.background-image` IMG computes `position: static;
     * display: inline-block` regardless of whether the page provides
     * its own image or falls back to the default ASCII hole. The
     * absolute positioning lives on the WRAPPING DIV, not the IMG —
     * mirror that on both branches. */}
    <div className={image ? 'absolute inset-0' : 'absolute inset-0 opacity-[0.28]'}>
      <img
        src={image ? image.src : '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png'}
        alt={image ? image.alt : ''}
        className='h-full w-full object-cover'
        style={{ textAlign: 'start', position: 'static', display: 'inline-block' }}
      />
    </div>
    <div data-wf-el='heading-stack' className={classNames('relative mx-auto text-center', headingClassName === 'text-white' ? 'text-white' : '', wideDescription ? 'max-w-[1238px]' : 'max-w-[978px]')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', paddingTop: '64px', paddingBottom: '64px' }}>
      <h2 className={classNames('fluid-h3', headingClassName)}>
        {title}
      </h2>
      <p className={classNames('fluid-body-lg', descriptionClassName ?? 'text-[#b3a88c]', wideDescription ? '' : 'max-w-[560px]')} style={{ marginTop: '10.4px', marginBottom: '20.8px', marginLeft: '0px', marginRight: '0px', ...(wideDescription ? { minHeight: '99.812px' } : {}) }}>
        {renderTextWithBreaks(description)}
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
  <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgb(34, 21, 13)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', minHeight: '629px' }}>
    <div className='mx-auto grid max-w-[1278px] gap-0 lg:grid-cols-2'>
      {/* Live's image-card parent is flex (Webflow grid-cell wrapper)
       * and the IMG itself computes display:block. Set both
       * explicitly so the parity check matches. */}
      <div data-wf-el='product-list_img_wrap' className='rounded-[18px] bg-brand-bg shadow-[0_0_0_1px_rgba(249,240,217,0.08)]' style={{ borderTop: '1px solid rgb(249, 240, 217)', boxSizing: 'border-box', display: 'flex', width: '599px', maxWidth: '100%', marginLeft: '20px', padding: '96px 64px 64px' }}>
        <img src={image.src} alt={image.alt} style={{ width: '469px', height: '307px', borderRadius: '0px', color: 'rgb(249, 240, 217)', display: 'block', objectFit: 'scale-down' }} />
      </div>
      <div data-wf-el='heading-stack' className='text-brand-bg' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', paddingLeft: '20px', paddingRight: '20px', minHeight: '469px' }}>
        <h2 className='section-title'>{title}</h2>
        {/* Live's intro description P here computes margin:0 (lives
         * inside a flex column heading-stack which doesn't add any
         * P spacing). */}
        <p className='fluid-body-lg text-[#b3a88c]' style={{ marginTop: '0px', marginBottom: '20.8px', width: '599px', maxWidth: '100%' }}>{description}</p>
      </div>
    </div>
  </section>
);

const ProductList = ({ items }: { items: readonly string[] }) => (
  <div data-wf-el='product-list_ul' style={{ borderStyle: 'none', textAlign: 'start', width: '571px', maxWidth: '100%', marginTop: '0px' }}>
    {items.map((item) => (
      <div data-wf-el='product-list_element' key={item} className='py-4 text-[#5f5f5f] font-medium' style={{ fontSize: '20.8px', lineHeight: '24.96px', display: 'block', textAlign: 'start', minHeight: '57.953px', borderBottom: '1px solid rgba(34, 21, 13, 0.28)' }}>
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
}) => {
  const useLiveCliImageHeight = src.includes('699490d1d9729682e0daf0a5_cli') || className.includes('cli-how-height');

  return (
    <div data-wf-el='product-list_img_wrap' className={classNames('rounded-[18px]', className)} style={{ backgroundColor: 'rgba(0,0,0,0)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgb(179, 168, 140)', boxShadow: 'none', padding: '64px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <img data-wf-el='product-list_img' src={src} alt={alt} className='img-block w-full' style={{ borderRadius: '0px', objectFit: 'scale-down', ...(useLiveCliImageHeight ? { height: '322.906px' } : {}) }} />
    </div>
  );
};

export const ProductComparisonTable = ({
  dark = false,
  headerColor,
  ctaHref,
  ctaLabel,
  minHeight,
}: {
  dark?: boolean;
  headerColor?: string;
  ctaHref?: string;
  ctaLabel?: string;
  minHeight?: number;
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
    <section data-wf-el='section' className={classNames('relative', dark ? 'text-brand-bg' : 'text-brand-fg')} style={{ display: 'block', backgroundColor: dark ? 'rgb(34, 21, 13)' : 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', ...(minHeight ? { minHeight: `${minHeight}px` } : {}) }}>
      <div data-wf-el='container' className='relative mx-auto max-w-[1238px]' style={{ display: 'block', color: dark ? 'rgb(249, 240, 217)' : 'rgb(34, 21, 13)', zIndex: 1, marginTop: minHeight ? '128px' : '0px', marginBottom: minHeight ? '128px' : '0px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginLeft: '-20px', marginRight: '-20px' }}>
          <div className={classNames('section-title max-w-[599px] text-center', headingClass)} style={{ marginBottom: '8.8px' }}>
            The only open, secure, and scalable agent platform built for real engineering work
          </div>
        </div>
        <div data-wf-el='product-table' className='overflow-x-auto' style={{ display: 'block', position: 'relative', marginTop: '49.6px', width: '100%', color: dark ? 'rgb(249, 240, 217)' : 'rgb(34, 21, 13)' }}>
          <table className='w-full border-collapse text-left'>
            <colgroup>
              <col style={{ width: '407px' }} />
              <col style={{ width: '262px' }} />
              <col style={{ width: '125px' }} />
              <col style={{ width: '280px' }} />
              <col style={{ width: '165px' }} />
            </colgroup>
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
                  <td className={classNames('text-left text-[16px] font-medium', cellClass)} style={{ paddingTop: '17px', paddingBottom: '17px', paddingLeft: '0px', paddingRight: '0px' }}>{row.label}</td>
                  {row.values.map((value, index) => (
                    <td key={`${row.label}-${index}`} className='text-center' style={{ paddingTop: '17px', paddingBottom: '17px', paddingLeft: '0px', paddingRight: '0px' }}>
                      {value ? (
                        <img data-wf-el='icon' src={TABLE_TICK_ICON} alt='' aria-hidden='true' className='mx-auto h-6 w-6' style={{ display: 'inline-flex', fontSize: '20px', lineHeight: '28px', color: tickColor }} />
                      ) : (
                        <img data-wf-el='icon' src='/assets/webflow/misc/Cross.svg' alt='' aria-hidden='true' className='mx-auto h-6 w-6' style={{ display: 'inline-flex', fontSize: '20px', lineHeight: '28px', color: tickColor }} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ctaHref && ctaLabel ? (
          <div className='text-center' style={{ marginTop: '49.6px' }}>
            <ProductPageActionLink
              href={ctaHref}
              label={ctaLabel}
              variant={dark ? 'lightbrown' : 'primary'}
              wrapperStyle={{ marginBottom: '0px' }}
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
      <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ display: 'block', paddingTop: '0px', paddingBottom: '0px', gap: 'normal' }}>
        <div className='grid gap-10 lg:grid-cols-[492.5px_minmax(0,1fr)] lg:gap-10' style={{ alignItems: 'start' }}>
        <div style={{ width: '492.5px', maxWidth: '100%' }}>
          <h2 className='section-title text-brand-fg' style={{ marginBottom: '22px' }}>
            FAQ&apos;s
          </h2>
          <div data-wf-el='standard-wrap'>
            <ProductPageActionLink href='/contact' label='Contact us' variant='outline' />
          </div>
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
                  data-accordion-start-open='false'
                  className='group'
                  style={{ borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgb(249, 240, 217)', display: 'flex', flexDirection: 'column', padding: '0' }}
                >
                  <summary data-wf-el='accordion-trigger' className='flex cursor-pointer list-none items-center justify-between font-normal text-brand-fg' style={{ fontSize: '16px', lineHeight: '22.4px', padding: '24px', gap: 'normal', borderBottom: '1px solid rgb(249, 240, 217)' }}>
                    <label data-wf-el='accordion-title' className='block pointer-events-none cursor-default font-medium' style={{ paddingRight: '12px', fontSize: '24px', lineHeight: '33.6px' }}>{faq.question}</label>
                    <div data-wf-el='accordion-icon' className='h-8 w-8 flex-shrink-0 overflow-hidden text-brand-fg transition-transform group-open:rotate-180' style={{ display: 'block' }} aria-hidden='true'>
                      <svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M10 13l6 6 6-6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></svg>
                    </div>
                  </summary>
                  <div data-wf-el='accordion-content_spacer' style={{ color: 'rgb(34, 21, 13)', marginTop: '16px', marginLeft: '24px', marginRight: '24px', padding: '0px' }}><p className='font-sohne-buch text-[16px] leading-[22.4px]' style={{ color: 'rgb(95, 95, 95)' }}>{faq.answer}</p></div>
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
        <p className='fluid-body-lg w-full text-[#5f5f5f]' style={{ marginBottom: '1em' }}>{description}</p>
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
  const proofBandMinHeight = isGui ? 'min-h-[420px]' : isSdk ? 'min-h-[407px]' : 'min-h-[467px]';
  const capabilitiesMinHeight = isGui ? 1227 : isSdk ? 1188 : 1194;
  const heroHeight = isCli ? '432px' : isGui ? '407px' : '382px';
  return (
    <main data-wf-el='page-main' style={{ display: 'flex', flexDirection: 'column' }}>
      <section
        data-wf-el='section-product_hero'
        className='relative'
        style={{ padding: '0', overflow: 'visible' }}
      >
        <div data-wf-el='asci-wrap' className='pointer-events-auto absolute inset-x-0 top-0 h-screen overflow-hidden' style={{ '--ascii-opacity': '0.12' } as CSSProperties} aria-hidden='true'>
          <ASCIIAnimation className='h-full w-full' />
        </div>
        <div data-wf-el='hero' className='relative flex w-full flex-col items-center' style={{ textAlign: 'start', justifyContent: 'flex-start', height: heroHeight, overflow: 'visible' }}>
          <div className='mx-auto flex max-w-[860px] flex-col items-center' style={{ height: heroHeight, justifyContent: 'center', paddingTop: '56px', paddingBottom: '56px' }}>
            <ProductEyebrow label={page.eyebrow} />
            <h1 className='fluid-h1 text-brand-fg' style={{ textAlign: 'center' }}>
              {page.heading}
            </h1>
            <p data-wf-el='paragraph-lg' className='fluid-body-lg max-w-[560px] text-[#5f5f5f]' style={{ textAlign: 'center', marginTop: '10.4px', marginBottom: '20.8px' }}>{page.description}</p>
            <div className='flex flex-wrap' style={{ paddingTop: '32px', gap: '8px 16px', textAlign: 'center' }}>
              <ProductPageActionLink
                href={page.primaryCta.href}
                label={page.primaryCta.label}
              />
              <ProductPageActionLink
                href={page.secondaryCta.href}
                label={page.secondaryCta.label}
                variant='outline'
              />
            </div>
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
            minHeightClass={isSdk ? 'min-h-[442px]' : undefined}
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

      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgb(249, 240, 217)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', minHeight: `${capabilitiesMinHeight}px` }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ display: 'block' }}>
          <div className='grid gap-10 lg:grid-cols-2' style={{ marginBottom: '128px', alignItems: 'start', marginLeft: '-20px', marginRight: '-20px' }}>
            <div data-wf-el='card' style={{ borderStyle: 'none' }}>
              <div data-wf-el='card-body' style={{ padding: '24px' }}>
                <h2 className='section-title text-brand-fg' style={{ textAlign: 'start' }}>
                  Key capabilities
                </h2>
                <ProductList items={page.capabilities} />
              </div>
            </div>
            <ProductImageCard src={page.showcaseImages[0].src} alt={page.showcaseImages[0].alt} className='lg:-translate-x-5' />
          </div>
          <div className='grid gap-10 lg:grid-cols-2' style={{ alignItems: 'start', marginLeft: '-20px', marginRight: '-20px' }}>
            <ProductImageCard src={page.showcaseImages[1].src} alt={page.showcaseImages[1].alt} className={classNames('lg:translate-x-5', isCli && 'cli-how-height')} />
            <div data-wf-el='card' style={{ borderStyle: 'none' }}>
              <div data-wf-el='card-body' style={{ padding: '24px' }}>
                <h2 className='section-title text-brand-fg' style={{ textAlign: 'start' }}>
                  How teams use it
                </h2>
                <ProductList items={page.useCases} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductComparisonTable dark ctaHref={AGENT_CANVAS_DOWNLOAD_URL} ctaLabel='Download Agent Canvas' minHeight={1082} />
      <ProductFaqSection faqs={faqs} />
      {/* Live renders the page-specific closing CTA inside the yellow footer
        section, and the footer section itself is a child of page-main. */}
      <Footer
        standalone
        showSocialLinks
        compactNav
        minHeight={1056}
        marketingCtaTitle={page.closingTitle}
        marketingCtaDescription={page.closingDescription}
        marketingCtaPrimary={page.closingPrimaryCta}
        marketingCtaSecondary={page.closingSecondaryCta}
      />
    </main>
  );
};
