import { Download } from 'lucide-react';
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import type { ProductFeatureFaq, ProductFeaturePageData, ProductFeatureVariant } from '~/data/product-feature-pages';
import { Footer } from '~/components/footer';
import { getRouteFooterProps } from '~/constants/route-layout';
import { GET_OPENHANDS_CTA } from '~/constants/site-shell';
import { PixelBlastBackground } from '~/components/pixel-blast-background';
import { HeroAppPreview } from '~/components/hero-app-preview';
import { ProductCanvasAcpSection } from '~/components/product-canvas-acp-section';
import { ProductCanvasBackendsSection } from '~/components/product-canvas-backends-section';
import { ProductCanvasGetStartedSection } from '~/components/product-canvas-get-started-section';
import { ProductCanvasFeatureGrid } from '~/components/product-canvas-feature-grid';
import { HERO_APP_PREVIEW_SLIDES } from '~/constants/hero-app-preview-slides';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { FAQ_TRIGGER_DIVIDER, CLOSED_FAQ_ITEM_PROPS } from '~/components/faq-accordion';

export interface ProductPageAction {
  label: string;
  href: string;
  variant?: 'primary' | 'outline' | 'lightbrown';
  screenReaderLabel?: string;
  icon?: ReactNode;
}

export type ProductFaqItem = ProductFeatureFaq;

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

const ProductEyebrow = ({ label }: { label: string }) => (
  <div className='mb-6'>
    <div data-wf-el='banner' className='rounded-[4px] bg-brand-accent font-normal text-brand-fg' style={{ display: 'block', fontSize: '16px', lineHeight: '22.4px', marginBottom: '0px', padding: '0', textAlign: 'center' }}>
      <div data-wf-el='banner-wrap' style={{ fontSize: '16px', fontWeight: 400, lineHeight: '22.4px', paddingTop: '12.8px', paddingBottom: '12.8px', paddingLeft: '32px', paddingRight: '32px', textAlign: 'center' }}>{label}</div>
    </div>
  </div>
);

export const ProductPageActionLink = ({
  href,
  label,
  variant = 'primary',
  className = '',
  screenReaderLabel,
  wrapperStyle,
  icon,
}: ProductPageAction & { className?: string; wrapperStyle?: React.CSSProperties }) => {
  return (
    <OverlayLinkButton
      href={href}
      label={label}
      srLabel={screenReaderLabel}
      variant={variant}
      className={className}
      wrapperStyle={wrapperStyle}
      icon={icon}
      iconWrapWfEl={icon ? 'btn-icon' : undefined}
      wfEl='button'
      textWfEl='btn-text'
    />
  );
};

const renderTextWithBreaks = (text: string) =>
  text.split('\n').map((part, index) => (
    <Fragment key={`${part}-${index}`}>{index > 0 ? <br /> : null}{part}</Fragment>
  ));

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
  <section data-wf-el='section' className='product-feature-section relative' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
    <div
      data-wf-el='asci-wrap'
      className='absolute inset-0 overflow-hidden bg-brand-accent'
      style={{ maxHeight: '2400px', ...(!image ? { '--ascii-opacity': '0.14' } : {}) } as CSSProperties}
      aria-hidden='true'
    >
      {image ? (
        <img
          data-wf-el='asci-media'
          src={image.src}
          alt={image.alt}
          className='h-full w-full object-cover'
          style={{ position: 'static', display: 'inline-block' }}
        />
      ) : (
        <PixelBlastBackground className='h-full w-full' />
      )}
    </div>
    <div data-wf-el='container' className='product-feature-container mx-auto max-w-[1238px]'>
      <div data-wf-el='heading-stack' className={classNames('relative text-center', wideDescription ? '' : '')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', paddingTop: '64px', paddingBottom: wideDescription ? '64px' : '65px', width: '100%' }}>
        <h2 className='fluid-h3 text-brand-fg' style={{ textAlign: 'center' }}>
          {title}
        </h2>
        <p data-wf-el='paragraph-lg' className={classNames('fluid-body-lg text-[#5f5f5f]', wideDescription ? '' : 'max-w-[560px]')} style={{ marginTop: '10.4px', marginBottom: '20.8px', marginLeft: '0px', marginRight: '0px', textWrap: 'pretty', ...(wideDescription ? { wordSpacing: '0.06px' } : {}) }}>
          {renderTextWithBreaks(description)}
        </p>
        {wideDescription ? <div aria-hidden='true' style={{ height: '1px', flex: '0 0 auto' }} /> : null}
      </div>
    </div>
  </section>
);

export const ProductFeatureProofBand = ({
  title,
  description,
  image,
  headingClassName = 'text-white',
  wideDescription = false,
  descriptionClassName,
}: {
  title: string;
  description: string;
  image?: ProductFeaturePageData['accentImage'];
  headingClassName?: string;
  wideDescription?: boolean;
  descriptionClassName?: string;
}) => (
  <section data-wf-el='section' className='product-feature-section relative' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
    <div data-wf-el='asci-wrap' className={image && headingClassName === 'text-brand-fg' ? 'absolute inset-0 overflow-hidden bg-brand-accent' : image ? 'absolute inset-0 overflow-hidden bg-brand-fg' : 'absolute inset-0 overflow-hidden bg-brand-fg opacity-[0.28]'} style={{ maxHeight: '2400px', pointerEvents: image ? undefined : 'auto' }} aria-hidden='true'>
      {image ? (
        <img
          data-wf-el='asci-media'
          src={image.src}
          alt={image.alt}
          className='h-full w-full object-cover'
          style={{ textAlign: 'start', position: 'static', display: 'inline-block' }}
        />
      ) : (
        <PixelBlastBackground className='h-full w-full' />
      )}
    </div>
    <div data-wf-el='container' className='product-feature-container mx-auto max-w-[1238px]'>
      <div data-wf-el='heading-stack' className={classNames('relative text-center', headingClassName === 'text-white' ? 'text-white' : '')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', paddingTop: '64px', paddingBottom: wideDescription ? '64px' : '65px', width: '100%' }}>
        <h2 className={classNames('fluid-h3', headingClassName)} style={{ marginBottom: '9.6px' }}>
          {title}
        </h2>
        <p data-wf-el='paragraph-lg' className={classNames('fluid-body-lg', descriptionClassName ?? 'text-[#b3a88c]', wideDescription ? '' : 'max-w-[560px]')} style={{ marginTop: '10.4px', marginBottom: '20.8px', marginLeft: '0px', marginRight: '0px', textWrap: 'pretty', ...(wideDescription ? { wordSpacing: '0.06px' } : {}) }}>
          {renderTextWithBreaks(description)}
        </p>
        {wideDescription ? <div aria-hidden='true' style={{ height: '1px', flex: '0 0 auto' }} /> : null}
      </div>
    </div>
  </section>
);

const ProductList = ({ items }: { items: readonly string[] }) => (
  <ul data-wf-el='product-list_ul' className='product-list' style={{ borderStyle: 'none', textAlign: 'start', width: '571px', marginTop: '0px', listStyleType: 'none', paddingLeft: '0px' }}>
    {items.map((item) => (
      <li data-wf-el='product-list_element' key={item} className='product-list-item fluid-body-lg py-4 text-[#5f5f5f] font-medium' style={{ display: 'list-item', textAlign: 'start', borderBottom: '1px solid rgba(24, 24, 24, 0.28)' }}>
        {item}
      </li>
    ))}
  </ul>
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
    <div data-wf-el='product-list_img_wrap' className={classNames('product-image-card rounded-[18px]', className)} style={{ backgroundColor: 'rgba(0,0,0,0)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgb(179, 168, 140)', boxShadow: 'none', padding: '64px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', minHeight: '100%' }}>
      <img data-wf-el='product-list_img' src={src} alt={alt} className='img-block w-full' style={{ borderRadius: '0px', objectFit: 'scale-down', ...(useLiveCliImageHeight ? { height: '322.906px' } : {}) }} />
    </div>
  );
};

export const ProductFeatureShowcaseSection = ({
  capabilities,
  useCases,
  showcaseImages,
  variant,
}: {
  capabilities: readonly string[];
  useCases: readonly string[];
  showcaseImages: ProductFeaturePageData['showcaseImages'];
  variant: ProductFeatureVariant;
}) => {
  const isCli = variant === 'cli';

  return (
    <section data-wf-el='section' className='product-feature-section product-showcase-section product-feature-grid-section relative' style={{ display: 'block', backgroundColor: 'rgb(247, 243, 238)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
      <div data-wf-el='container' className='product-feature-container mx-auto max-w-[1238px]' style={{ display: 'block' }}>
        <div className='product-showcase-grid product-feature-row product-feature-row-capabilities product-detail-grid product-detail-grid--top grid gap-10 lg:grid-cols-2' style={{ marginBottom: '128px', alignItems: 'start', marginLeft: '-20px', marginRight: '-20px' }}>
          <div data-wf-el='card' style={{ borderStyle: 'none', borderRadius: '8px', position: 'relative', display: 'flex', overflow: 'hidden', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <div data-wf-el='card-body' style={{ padding: '24px', position: 'relative', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <h2 className='section-title text-brand-fg' style={{ textAlign: 'start' }}>
                Key capabilities
              </h2>
              <ProductList items={capabilities} />
            </div>
          </div>
          <div style={isCli ? { transform: 'translateX(-20px)' } : undefined}>
            <ProductImageCard src={showcaseImages[0].src} alt={showcaseImages[0].alt} className={isCli ? '' : 'lg:-translate-x-5'} />
          </div>
        </div>
        <div className='product-showcase-grid product-feature-row product-feature-row-usecases product-detail-grid grid gap-10 lg:grid-cols-2' style={{ alignItems: 'start', marginLeft: '-20px', marginRight: '-20px' }}>
          <div style={isCli ? { transform: 'translateX(20px)' } : undefined}>
            <ProductImageCard src={showcaseImages[1].src} alt={showcaseImages[1].alt} className={classNames(!isCli && 'lg:translate-x-5', isCli && 'cli-how-height')} />
          </div>
          <div data-wf-el='card' style={{ borderStyle: 'none', borderRadius: '8px', position: 'relative', display: 'flex', overflow: 'hidden', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <div data-wf-el='card-body' style={{ padding: '24px', position: 'relative', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <h2 className='section-title text-brand-fg' style={{ textAlign: 'start' }}>
                How teams use it
              </h2>
              <ProductList items={useCases} />
            </div>
          </div>
        </div>
      </div>
    </section>
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
  const headingClass = dark ? 'text-brand-bg' : 'text-brand-fg';
  const cellClass = dark ? 'text-[#b3a88c]' : 'text-[#5f5f5f]';
  const trColor = headerColor ?? (dark ? 'rgb(247, 243, 238)' : 'rgb(24, 24, 24)');
  // Live computed colors for product-table_th: rgb(24,24,24) on light bg,
  // rgb(247,243,238) on dark bg. Live also uses fontWeight 400 (not 500).
  const thColor = headerColor ?? (dark ? 'rgb(247, 243, 238)' : 'rgb(24, 24, 24)');
  const tickColor = headerColor ?? (dark ? 'rgb(179, 168, 140)' : 'rgb(138, 95, 69)');

  return (
    <section data-wf-el='section' className={classNames('product-feature-section product-comparison-section relative', dark ? 'text-brand-bg' : 'text-brand-fg')} style={{ display: 'block', backgroundColor: dark ? 'rgb(24, 24, 24)' : 'rgba(0, 0, 0, 0)', paddingTop: 'var(--product-comparison-padding-top, var(--product-section-padding-y, 80px))', paddingBottom: 'var(--product-comparison-padding-bottom, var(--product-section-padding-y, 80px))', paddingLeft: '0px', paddingRight: '0px' }}>
      <div data-wf-el='container' data-product-comparison-container className='product-feature-container product-comparison-container mx-auto max-w-[1238px]' style={{ display: 'block', color: dark ? 'rgb(247, 243, 238)' : 'rgb(24, 24, 24)', zIndex: 1, width: 'var(--product-container-width, 100%)', height: 'var(--product-comparison-container-height, auto)', marginTop: minHeight ? '128px' : '0px', marginBottom: minHeight ? '128px' : '0px' }}>
        <div className='product-comparison-heading-row' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginLeft: '-20px', marginRight: '-20px' }}>
          <div className={classNames('section-title text-center', headingClass)} style={{ marginBottom: 'var(--product-comparison-heading-margin-bottom, 8.8px)', maxWidth: 'var(--product-comparison-heading-max-width, 599px)' }}>
            The only open, secure, and scalable agent platform built for real engineering work
          </div>
        </div>
        <div style={{ width: '100%', color: dark ? 'rgb(247, 243, 238)' : 'rgb(24, 24, 24)' }}>
          <table data-wf-el='product-table' className='w-full border-collapse text-left' style={{ display: 'table', position: 'relative', overflow: 'visible', marginTop: '49.6px', transform: 'var(--product-comparison-content-transform, none)', color: 'rgb(247, 243, 238)' }}>
            <colgroup>
              <col style={{ width: 'var(--product-table-col-1, 407px)' }} />
              <col style={{ width: 'var(--product-table-col-2, 262px)' }} />
              <col style={{ width: 'var(--product-table-col-3, 125px)' }} />
              <col style={{ width: 'var(--product-table-col-4, 280px)' }} />
              <col style={{ width: 'var(--product-table-col-5, 165px)' }} />
            </colgroup>
            <thead>
              <tr data-wf-el='product-table_tr' className={classNames('border-b text-[20px] leading-[28px]', dark ? 'border-brand-bg/20' : 'border-brand-fg/12')} style={{ color: trColor, fontSize: 'var(--product-table-row-font-size, 20px)', lineHeight: 'var(--product-table-row-line-height, 28px)' }}>
                <th data-wf-el='product-table_th' className='py-4 font-normal text-left' style={{ paddingTop: '16px', paddingBottom: '16px', paddingRight: '0px', letterSpacing: 'normal', textTransform: 'none', fontSize: 'var(--product-table-cell-font-size, inherit)', lineHeight: 'var(--product-table-cell-line-height, inherit)', color: thColor }}>Feature</th>
                <th data-wf-el='product-table_th' className='py-4 text-center font-normal' style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '0', paddingRight: '0', letterSpacing: 'normal', textTransform: 'none', fontSize: 'var(--product-table-cell-font-size, inherit)', lineHeight: 'var(--product-table-cell-line-height, inherit)', color: thColor }}>OpenHands</th>
                <th data-wf-el='product-table_th' className='py-4 text-center font-normal' style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '0', paddingRight: '0', letterSpacing: 'normal', textTransform: 'none', fontSize: 'var(--product-table-cell-font-size, inherit)', lineHeight: 'var(--product-table-cell-line-height, inherit)', color: thColor }}>Devin</th>
                <th data-wf-el='product-table_th' className='py-4 text-center font-normal' style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '0', paddingRight: '0', letterSpacing: 'normal', textTransform: 'none', fontSize: 'var(--product-table-cell-font-size, inherit)', lineHeight: 'var(--product-table-cell-line-height, inherit)', color: thColor }}><span className='product-table-claude-code product-table-claude-label'>Claude Code</span></th>
                <th data-wf-el='product-table_th' className='py-4 text-center font-normal' style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '0', paddingRight: '0', letterSpacing: 'normal', textTransform: 'none', fontSize: 'var(--product-table-cell-font-size, inherit)', lineHeight: 'var(--product-table-cell-line-height, inherit)', color: thColor }}>Factory</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_COMPARISON_ROWS.map((row) => (
                <tr key={row.label} data-wf-el='product-table_tr' className='text-[20px] leading-[28px] font-normal' style={{ color: tickColor, borderBottomWidth: '0px', fontSize: 'var(--product-table-row-font-size, 20px)', lineHeight: 'var(--product-table-row-line-height, 28px)' }}>
                  <td data-wf-el='product-table_th' className={classNames('text-left font-normal', cellClass)} style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '0px', paddingRight: '0px', letterSpacing: 'normal', textTransform: 'none', fontSize: 'var(--product-table-cell-font-size, inherit)', lineHeight: 'var(--product-table-cell-line-height, inherit)', color: tickColor }}>{row.label}</td>
                  {row.values.map((value, index) => (
                    <td data-wf-el='product-table_th' key={`${row.label}-${index}`} className='text-center font-normal' style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '8px', paddingRight: '8px', letterSpacing: 'normal', textTransform: 'none', fontSize: 'var(--product-table-cell-font-size, inherit)', lineHeight: 'var(--product-table-cell-line-height, inherit)', color: tickColor }}>
                      {value ? (
                        <img data-wf-el='icon' src={TABLE_TICK_ICON} alt='' aria-hidden='true' className='mx-auto h-6 w-6' style={{ display: 'inline-flex', fontSize: 'var(--product-table-cell-font-size, 20px)', lineHeight: 'var(--product-table-cell-line-height, 28px)', color: tickColor }} />
                      ) : (
                        <img data-wf-el='icon' src='/assets/webflow/misc/Cross.svg' alt='' aria-hidden='true' className='mx-auto h-6 w-6' style={{ display: 'inline-flex', fontSize: 'var(--product-table-cell-font-size, 20px)', lineHeight: 'var(--product-table-cell-line-height, 28px)', color: tickColor }} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ctaHref && ctaLabel ? (
          <div className='text-center' style={{ display: 'flex', justifyContent: 'center', marginTop: '49.6px', transform: 'var(--product-comparison-content-transform, none)' }}>
            <div data-wf-el='standard-wrap' style={{ display: 'block', width: '125.969px', textAlign: 'start' }}>
              <ProductPageActionLink
                href={ctaHref}
                label={ctaLabel}
                variant={dark ? 'lightbrown' : 'primary'}
                wrapperStyle={{ marginBottom: '0px' }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};


const renderFaqQuestion = (question: string) => {
  if (question === 'Is the OpenHands CLI suitable for advanced engineering workflows?') {
    return 'Is the OpenHands CLI suitable for advanced engineering\u00a0workflows?';
  }
  return question;
};

export const ProductFaqSection = ({ faqs }: { faqs: readonly ProductFaqItem[] }) => {
  return (
    <section data-wf-el='section' className='product-feature-section product-faq-section relative' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', marginTop: '-1px' }}>
      <div data-wf-el='container' className='product-feature-container product-faq-container mx-auto max-w-[1238px]' style={{ display: 'block', paddingTop: '0px', paddingBottom: '0px', gap: 'normal' }}>
        <div className='product-faq-row product-faq-layout' style={{ display: 'flex', alignItems: 'start', marginLeft: '-20px', marginRight: '-20px' }}>
          <div className='product-faq-heading-col' style={{ display: 'flex', flexDirection: 'column', position: 'relative', width: '41.6667%', maxWidth: '41.6667%', paddingLeft: '20px', paddingRight: '20px' }}>
            <h2 className='section-title text-brand-fg' style={{ marginBottom: '22px' }}>
              FAQ&apos;s
            </h2>
            <div data-wf-el='standard-wrap'>
              <ProductPageActionLink href='/contact' label='Contact us' variant='outline' />
            </div>
          </div>
          <div className='product-faq-list-col' style={{ display: 'flex', flexDirection: 'column', position: 'relative', width: '58.3333%', maxWidth: '58.3333%', paddingLeft: '20px', paddingRight: '20px' }}>
            <div data-wf-el='standard-collection' className='border-brand-fg/15' style={{ borderStyle: 'none', width: '706px' }}>
              <div role='list' data-wf-el='standard-collection-list'>
                {faqs.map((faq) => (
                  <div role='listitem' key={faq.question} data-wf-el='standard-collection-list-item' style={{ display: 'block', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <details
                      data-wf-el='accordion-item'
                      {...CLOSED_FAQ_ITEM_PROPS}
                      className='group'
                      style={{ borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgb(247, 243, 238)', display: 'flex', flexDirection: 'column', padding: '0' }}
                    >
                      <summary data-wf-el='accordion-trigger' className='flex cursor-pointer list-none items-center justify-between font-normal text-brand-fg' style={{ fontSize: '16px', lineHeight: '22.4px', padding: '24px', gap: 'normal', borderBottom: FAQ_TRIGGER_DIVIDER, overflow: 'hidden' }}>
                        <label data-wf-el='accordion-title' className='fluid-h4 block pointer-events-none cursor-default font-medium' style={{ paddingRight: '12px' }}>{renderFaqQuestion(faq.question)}</label>
                        <svg data-wf-el='accordion-icon' className='h-8 w-8 flex-shrink-0 text-brand-fg' width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' style={{ verticalAlign: 'baseline' }}>
                          <path fillRule='evenodd' clipRule='evenodd' d='M17 17L27.3137 17L27.3137 15H17V4.68631L15 4.68631L15 15H4.68629L4.68629 17L15 17V27.3137H17V17Z' fill='currentColor' />
                        </svg>
                      </summary>
                      <div style={{ paddingLeft: '24px', paddingRight: '24px' }}>
                        <div data-wf-el='accordion-content_spacer' style={{ color: 'rgb(24, 24, 24)', marginTop: '0px', marginLeft: '0px', marginRight: '0px', padding: '0px 0px 24px' }}>
                          <div data-wf-el='slot' style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div data-wf-el='rich-text-component' style={{ marginTop: '16px' }}>
                              <div data-wf-el='rich-text' className='font-sohne-buch' style={{ maxWidth: '820px', width: '100%' }}>
                                <p className='font-sohne-buch text-[16px] leading-[22.4px]' style={{ color: 'rgb(95, 95, 95)', marginBottom: '0px' }}>{faq.answer}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
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
  variant,
}: {
  page: ProductFeaturePageData;
  variant: ProductFeatureVariant;
}) => {
  const isGui = variant === 'gui';
  const isCli = variant === 'cli';
  const heroHeight = isCli ? '432px' : isGui ? '407px' : '382px';
  return (
    <main data-wf-el='page-main' data-product-feature-page={variant} className={classNames('product-feature-page', `product-feature-page--${variant}`)} style={{ display: 'flex', flexDirection: 'column', ...(variant === 'sdk' ? { paddingBottom: '1px', marginBottom: '-1px' } : {}), ...(isGui ? { marginBottom: '-0.313px' } : {}) }}>
      <section
        data-wf-el='section-product_hero'
        style={{ padding: '0', overflow: 'visible' }}
      >
        <div data-wf-el='asci-wrap' className='product-hero-ascii pointer-events-auto absolute inset-x-0 top-0 h-screen overflow-hidden' style={{ '--ascii-opacity': '0.12', maxHeight: '2400px' } as CSSProperties} aria-hidden='true'>
          <PixelBlastBackground className='h-full w-full' />
        </div>
        <div data-wf-el='hero' className='product-hero relative flex w-full flex-col items-center' style={{ textAlign: 'start', justifyContent: 'flex-start', height: heroHeight, overflow: 'hidden' }}>
          <div data-wf-el='container' className='product-feature-container mx-auto w-full max-w-[1238px]' style={{ display: 'block' }}>
            <div data-wf-el='hero-content' className='flex flex-col items-center' style={{ position: 'relative', width: '100%', height: heroHeight, justifyContent: 'center', paddingTop: '56px', paddingBottom: '56px', textAlign: 'center' }}>
            <ProductEyebrow label={page.eyebrow} />
            <h1 className='fluid-h1 text-brand-fg' style={{ textAlign: 'center' }}>
              {page.heading}
            </h1>
              <p data-wf-el='paragraph-lg' className='fluid-body-lg max-w-[560px] text-[#5f5f5f]' style={{ textAlign: 'center', marginTop: '10.4px', marginBottom: '20.8px', textWrap: 'pretty', ...(isCli ? { wordSpacing: '0.12px' } : {}) }}>{page.description}</p>
              <div data-wf-el='hero_btn_wrap' className='flex flex-wrap items-center justify-center' style={{ maxWidth: '100%', paddingTop: '32px', gap: '8px 16px', textAlign: 'center' }}>
              <ProductPageActionLink
                href={page.primaryCta.href}
                label={page.primaryCta.label}
                screenReaderLabel={page.primaryCta.screenReaderLabel}
                icon={
                  isGui ? (
                    <Download className='h-5 w-5' strokeWidth={2} aria-hidden='true' />
                  ) : undefined
                }
              />
              {page.secondaryCta ? (
                <ProductPageActionLink
                  href={page.secondaryCta.href}
                  label={page.secondaryCta.label}
                  screenReaderLabel={page.secondaryCta.screenReaderLabel}
                  variant='outline'
                />
              ) : null}
            </div>
          </div>
        </div>
        </div>
        {isGui ? (
          <div
            data-wf-el='hero-preview'
            className='relative z-10 mx-auto w-full max-w-[1238px] overflow-visible px-4 md:px-6'
            style={{ paddingTop: '56px', paddingBottom: '56px' }}
          >
            <HeroAppPreview slides={HERO_APP_PREVIEW_SLIDES} />
          </div>
        ) : null}
      </section>

      {isGui ? <ProductCanvasFeatureGrid /> : null}
      {isGui ? <ProductCanvasAcpSection /> : null}
      {isGui ? <ProductCanvasBackendsSection /> : null}
      {isGui ? <ProductCanvasGetStartedSection /> : null}

      {!isGui ? (
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
          />
        </>
      ) : null}

      {!isGui ? (
        <ProductFeatureShowcaseSection
          capabilities={page.capabilities}
          useCases={page.useCases}
          showcaseImages={page.showcaseImages}
          variant={variant}
        />
      ) : null}

      {!isGui ? (
        <ProductComparisonTable
          dark
          ctaHref={page.comparisonCta?.href ?? GET_OPENHANDS_CTA.href}
          ctaLabel={page.comparisonCta?.label ?? GET_OPENHANDS_CTA.label}
          minHeight={1082}
        />
      ) : null}
      {!isGui ? <ProductFaqSection faqs={page.faqs} /> : null}
      {/* Live renders the page-specific closing CTA inside the yellow footer
        section, and the footer section itself is a child of page-main. */}
      <Footer {...getRouteFooterProps(isGui ? '/product/canvas' : `/product/${variant}`)} />
    </main>
  );
};
