import { Link, useLocation } from 'react-router';
import { PixelBlastBackground } from '~/components/pixel-blast-background';
import clsx from 'clsx';
import { FOOTER_COMMUNITY_CTA, OPENHANDS_LINKEDIN_URL } from '~/constants/site-shell';
import { normalizePathname } from '~/utils/normalize-pathname';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { useWidth } from '~/hooks/use-media';

export interface FooterCta {
  href: string;
  label: string;
}

export interface FooterProps {
  standalone?: boolean;
  showSocialLinks?: boolean;
  compactNav?: boolean;
  compactNavSpacerHeight?: number;
  standaloneContainerHeight?: number;
  standaloneContainerFlowSpacerHeight?: number;
  navWidthClass?: string;
  minHeight?: number;
  compactSpacerHeight?: number | string;
  showCopyright?: boolean;
  footerContainerNudge?: number;
  footerContainerTransform?: string;
  containerWfEl?: string | null;
  layoutVariant?: 'default' | 'manifesto';
  /**
   * Render the legacy Webflow footer grid/row structure used by the
   * whitepaper page. Other routes keep the existing compact React layout
   * because their live footer variants intentionally omit the copyright row.
   */
  webflowLayout?: boolean;
  /**
   * When true (default), the footer renders the marketing CTA at
   * the top of the footer section, matching live's footer markup
   * which always nests the CTA inside `section.u-bg-primary` rather
   * than rendering it as a separate marketing-cta section.
   */
  showMarketingCta?: boolean;
  /**
   * Override the default marketing CTA copy / buttons.  Pages like
   * /product/cli, /product/gui, /product/sdk render a page-specific
   * "Control your agents like real infrastructure"-style CTA inside
   * their footer on live; supplying these props makes our local
   * footer render the same per-route copy.
   */
  marketingCtaTitle?: string;
  marketingCtaDescription?: string;
  marketingCtaPrimary?: FooterCta;
  marketingCtaSecondary?: FooterCta | null;
}

/**
 * Renders the "Building the open standard..." headline + supporting
 * paragraph + community CTA button that live
 * openhands.dev embeds at the top of every footer section.
 */
interface FooterMarketingCtaProps {
  title?: string;
  description?: string;
  primary?: FooterCta;
  secondary?: FooterCta | null;
  bottomMargin?: number;
}

const DEFAULT_CTA_TITLE = 'Building the open standard for autonomous software development.';
const DEFAULT_CTA_DESCRIPTION = 'OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.';
const DEFAULT_CTA_PRIMARY: FooterCta = { href: FOOTER_COMMUNITY_CTA.href, label: FOOTER_COMMUNITY_CTA.label };
const DEFAULT_CTA_SECONDARY: FooterCta | null = null;

const FooterMarketingCta = ({
  title = DEFAULT_CTA_TITLE,
  description = DEFAULT_CTA_DESCRIPTION,
  primary = DEFAULT_CTA_PRIMARY,
  secondary = DEFAULT_CTA_SECONDARY,
  bottomMargin = 127,
}: FooterMarketingCtaProps) => (
  // No data-wf-el here: live wraps the CTA copy in a generic div
  // inside the footer section, so adding a custom key here would
  // register as a phantom 'extra-on-test' wf element that has no
  // corresponding live counterpart.
  <div className='text-center' style={{ marginTop: '49px', marginBottom: '0px' }}>
    <div style={{ width: '852px', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '20px', paddingRight: '20px', boxSizing: 'border-box' }}>
      <div className='section-title max-w-[812px] tracking-[-0.02em] text-brand-fg' style={{ marginBottom: '22px' }}>
        {title}
      </div>
      <p data-wf-el='paragraph-lg' className='w-full fluid-body-lg font-medium text-brand-muted'>
        {description}
      </p>
      <div className='flex flex-wrap items-center justify-center gap-4' style={{ marginTop: '51px' }}>
        <OverlayLinkButton href={primary.href} label={primary.label} variant='primary' wfEl='button' textWfEl='btn-text' />
        {secondary ? (
          <OverlayLinkButton href={secondary.href} label={secondary.label} variant='outline' wfEl='button' textWfEl='btn-text' />
        ) : null}
      </div>
    </div>
  </div>
);

const SOCIAL_LINKS = [
  {
    href: '/joinslack',
    icon: '/assets/webflow/misc/6908d21b2270590dedae7f30_Frame48095725.svg',
    label: 'Join Slack',
  },
  {
    href: 'https://x.com/OpenHandsDev',
    icon: '/assets/webflow/misc/6908d21bd2a1305f4f77161b_Frame48095723.svg',
    label: 'X',
    external: true,
  },
  {
    href: 'https://github.com/OpenHands/OpenHands',
    icon: '/assets/webflow/misc/6908d21a36dee3e7147b3d21_Frame48095724.svg',
    label: 'GitHub',
    external: true,
  },
  {
    href: OPENHANDS_LINKEDIN_URL,
    icon: '/assets/webflow/misc/openhands-footer-linkedin.svg',
    label: 'LinkedIn',
    external: true,
  },
] as const;

const FOOTER_ROW_STYLE = {
  display: 'flex',
  flexWrap: 'wrap',
  alignContent: 'stretch',
  marginLeft: '-20px',
  marginRight: '-20px',
} as const;

const FOOTER_COL_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  paddingLeft: '20px',
  paddingRight: '20px',
  flex: '1 1 0%',
} as const;

const FOOTER_COL_LG_8_STYLE = {
  ...FOOTER_COL_STYLE,
  flexBasis: '66.67%',
  maxWidth: '66.6667%',
} as const;

const FOOTER_COL_SHRINK_STYLE = {
  ...FOOTER_COL_STYLE,
  flex: '0 0 auto',
} as const;

const FOOTER_COL_SHRINK_NO_PADDING_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  flex: '0 0 auto',
} as const;


const footerLegalTextStyle = {
  fontFamily: 'GeistMono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: 'var(--footer-eyebrow-font-size, 14px)',
  fontWeight: 400,
  lineHeight: '16.896px',
  wordSpacing: '0.2px',
} as const;

const footerLegalLinkStyle = {
  ...footerLegalTextStyle,
  textDecoration: 'none',
  cursor: 'pointer',
} as const;

type WebflowFooterContentProps = Pick<
  FooterProps,
  | 'showSocialLinks'
  | 'showMarketingCta'
  | 'showCopyright'
  | 'compactNavSpacerHeight'
  | 'footerContainerNudge'
  | 'marketingCtaTitle'
  | 'marketingCtaDescription'
  | 'marketingCtaPrimary'
  | 'marketingCtaSecondary'
  | 'layoutVariant'
> & {
  activePathname: string;
  isMobile: boolean;
  footerContainerTransform?: string;
  containerWfEl?: string | null;
  containerStyle?: React.CSSProperties;
};

const WebflowFooterContent = ({
  activePathname,
  isMobile,
  showSocialLinks = false,
  showMarketingCta = true,
  showCopyright = true,
  marketingCtaTitle,
  marketingCtaDescription,
  marketingCtaPrimary,
  marketingCtaSecondary,
  footerContainerNudge,
  footerContainerTransform,
  containerWfEl = 'container',
  containerStyle,
  layoutVariant = 'default',
}: WebflowFooterContentProps) => {
  const isManifesto = layoutVariant === 'manifesto';
  const isManifestoMobile = isManifesto && isMobile;
  const currentYear = new Date().getFullYear();
  const footerContainerStyle = {
    position: 'relative',
    zIndex: 1,
    width: isManifestoMobile ? '90%' : 'var(--footer-container-width, 90%)',
    maxWidth: '1238px',
    height: isManifesto ? (isManifestoMobile ? '1172.27px' : '950.1875px') : 'auto',
    top: isManifestoMobile ? '0px' : 'var(--footer-container-top, 0px)',
    marginLeft: 'auto',
    marginRight: 'auto',
    ...containerStyle,
    ...(footerContainerTransform ? { transform: footerContainerTransform, transformOrigin: 'top' } : {}),
  } as React.CSSProperties;
  const ctaColStyle = {
    ...FOOTER_COL_LG_8_STYLE,
    flexBasis: isManifestoMobile ? '100%' : 'var(--footer-cta-col-basis, 66.67%)',
    maxWidth: isManifestoMobile ? '100%' : 'var(--footer-cta-col-max-width, 66.6667%)',
  } as React.CSSProperties;
  const resolvedMarketingCtaPrimary = marketingCtaPrimary ?? DEFAULT_CTA_PRIMARY;
  const resolvedMarketingCtaSecondary = marketingCtaSecondary ?? DEFAULT_CTA_SECONDARY;
  const isContactActive = normalizePathname('/contact') === activePathname;

  return (
    <div data-wf-el={containerWfEl ?? undefined} className='container u-position-relative u-z-index-1' style={footerContainerStyle}>
      <div style={{ transform: isManifestoMobile ? 'none' : 'var(--footer-content-transform, none)' }}>
      {showMarketingCta ? (
        <div className='row row-justify-center u-mt-md u-position-relative u-z-index-1' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', position: 'relative', zIndex: 1, marginTop: isManifestoMobile ? '50px' : 'var(--footer-marketing-margin-top, var(--footer-cta-row-margin-top, 50px))' }}>
          <div className='col col-lg-8 col-sm-12 footer-cta-col' style={ctaColStyle}>
            <div className='h2 u-text-center u-mb-xs section-title text-brand-fg' style={{ textAlign: 'center', marginBottom: isManifestoMobile ? '14.7732px' : 'var(--footer-marketing-title-margin-bottom, var(--footer-cta-title-margin-bottom, 22px))', letterSpacing: '-0.02em' }}>
              {marketingCtaTitle ?? DEFAULT_CTA_TITLE}
            </div>
            <p data-wf-el='paragraph-lg' className='u-m-0 u-text-darkgray u-text-center font-medium text-brand-muted' style={{ margin: '0px', textAlign: 'center', fontSize: 'var(--footer-paragraph-lg-font-size, var(--paragraph-lg-font-size))', lineHeight: 'var(--footer-paragraph-lg-line-height, 1.2)', height: isManifestoMobile ? '85.1875px' : 'var(--footer-paragraph-lg-height, auto)' }}>
              {marketingCtaDescription ?? DEFAULT_CTA_DESCRIPTION}
            </p>
            <div className='row row-gap-button u-mt-md row-justify-center' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', columnGap: '16px', rowGap: '16px', marginTop: 'var(--footer-cta-buttons-margin-top, var(--footer-cta-button-margin-top, 51px))', flexDirection: (isManifestoMobile ? 'row' : 'var(--footer-cta-button-flex-direction, var(--footer-cta-button-direction, row))') as React.CSSProperties['flexDirection'], alignItems: 'center' }}>
              <div className='col col-shrink' style={FOOTER_COL_SHRINK_NO_PADDING_STYLE}>
                <OverlayLinkButton href={resolvedMarketingCtaPrimary.href} label={resolvedMarketingCtaPrimary.label} variant='primary' wfEl='button' textWfEl='btn-text' />
              </div>
              {resolvedMarketingCtaSecondary ? (
                <div className='col col-shrink' style={FOOTER_COL_SHRINK_NO_PADDING_STYLE}>
                  <OverlayLinkButton href={resolvedMarketingCtaSecondary.href} label={resolvedMarketingCtaSecondary.label} variant='outline' wfEl='button' textWfEl='btn-text' />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className='row row-justify-center u-mb-md'
        style={{
          ...FOOTER_ROW_STYLE,
          justifyContent: 'center',
          marginTop: isManifestoMobile ? '64px' : showMarketingCta ? 'var(--footer-social-margin-top, 80px)' : showSocialLinks ? '80px' : undefined,
          marginBottom: 'var(--footer-bottom-row-margin-bottom, 24px)',
        }}
      >
        <div className='col col-lg-8 footer-logo-col' style={FOOTER_COL_LG_8_STYLE}>
          <div className='row row-gap-sm row-justify-center' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', rowGap: '16px' }}>
            {isManifestoMobile ? (
              <div data-wf-el='standard-media' className='standard-media contain-center footer-logo-media' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'start', width: '211.65625px', height: '35.390625px', objectFit: 'contain' }}>
                <img data-wf-el='standard-media-img' className='footer-logo-img' src='/assets/webflow/backgrounds/openhands_logo_black.svg' alt='' style={{ display: 'block', width: '211.65625px', height: '35.390625px', textAlign: 'start', objectFit: 'scale-down' }} />
              </div>
            ) : (
              <div data-wf-el='standard-media' className='standard-media contain-center footer-logo-media' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'start', width: 'var(--footer-logo-width, 610px)', height: 'var(--footer-logo-height, 102px)', objectFit: 'contain' }}>
                <img data-wf-el='standard-media-img' className='footer-logo-img' src='/assets/webflow/backgrounds/openhands_logo_black.svg' alt='' style={{ display: 'block', width: 'var(--footer-logo-width, 610px)', height: 'var(--footer-logo-height, 102px)', textAlign: 'start', objectFit: 'scale-down' }} />
              </div>
            )}
          </div>
        </div>
        <div
          className='col col-lg-8 footer-copyright-col footer-legal-col'
          style={{ ...FOOTER_COL_LG_8_STYLE, marginTop: 'var(--footer-legal-margin-top, 39px)' }}
        >
          <div
            data-wf-el='footer-legal-row'
            className='footer-legal-row u-text-center'
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              textAlign: 'center',
              marginBottom: showSocialLinks ? '16px' : '21.12px',
            }}
          >
            {showCopyright ? (
              <div data-wf-el='eyebrow' className='eyebrow' style={footerLegalTextStyle}>
                <span style={{ display: 'inline-block', transform: 'scaleX(1.0038)', transformOrigin: 'center' }}>© <span data-year=' '>{currentYear}</span> OpenHands - All rights reserved</span>
              </div>
            ) : (
              <span className='sr-only'>© {currentYear} OpenHands - All rights reserved</span>
            )}
            <Link
              to='/privacy'
              data-wf-el='eyebrow'
              className='eyebrow is-link hover:text-[#565656]'
              style={footerLegalLinkStyle}
            >
              Privacy Policy
            </Link>
            <Link
              to='/contact'
              aria-current={isContactActive ? 'page' : undefined}
              data-wf-el='nav-link'
              className={clsx('nav-link is-link hover:text-[#565656]', isContactActive && 'text-[#565656]')}
              style={footerLegalLinkStyle}
            >
              Contact
            </Link>
          </div>
          {showSocialLinks ? (
            <div data-wf-el='footer-social-row' className='row row-justify-center' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', marginBottom: 'var(--footer-social-margin-bottom, 24px)', rowGap: '16px', textAlign: 'start' }}>
              <div className='col' style={{ ...FOOTER_COL_STYLE, flex: '1 1 100%', maxWidth: '100%' }}>
                <div className='row row-gap-sm row-justify-center' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', columnGap: '8px', rowGap: '16px' }}>
                  {SOCIAL_LINKS.map((item) => (
                    <div key={item.label} className='col col-shrink' style={FOOTER_COL_SHRINK_NO_PADDING_STYLE}>
                      <a
                        href={item.href}
                        {...('external' in item && item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        aria-label={item.label}
                        className='footer-social-link standard-media contain-center inline-flex items-center justify-center rounded-full border border-transparent text-brand-fg transition-all duration-200 ease-out hover:border-[rgba(24,24,24,0.2)] hover:bg-[rgba(255,255,255,0.34)] hover:backdrop-blur-[5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(24,24,24)]/30 active:scale-95'
                        data-wf-el='standard-media'
                        data-testid='footer-social-link'
                        style={{ width: '60px', height: '60px', maxWidth: '100%', textDecoration: 'none' }}
                      >
                        <img data-wf-el='standard-media-img' src={item.icon} alt='' style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        {footerContainerNudge ? <div aria-hidden='true' style={{ flexBasis: '100%', height: `${footerContainerNudge}px` }} /> : null}
      </div>
      </div>
    </div>
  );
};

export const Footer = ({
  standalone = false,
  showSocialLinks = false,
  compactNav = false,
  compactNavSpacerHeight,
  standaloneContainerHeight,
  standaloneContainerFlowSpacerHeight = 1,
  navWidthClass,
  minHeight: _minHeight,
  compactSpacerHeight = 0,
  showMarketingCta = true,
  showCopyright = true,
  footerContainerNudge,
  marketingCtaTitle,
  marketingCtaDescription,
  marketingCtaPrimary,
  marketingCtaSecondary,
  footerContainerTransform,
  containerWfEl,
  layoutVariant = 'default',
}: FooterProps) => {
  const activePathname = normalizePathname(useLocation().pathname);
  const width = useWidth();
  const isMobile = width < 768;
  const isManifesto = layoutVariant === 'manifesto';
  const isManifestoMobile = isManifesto && isMobile;
  const effectiveCompactSpacerHeight = isManifestoMobile ? 9.21 : compactSpacerHeight;
  const compactSpacerCssHeight = typeof effectiveCompactSpacerHeight === 'number' ? `var(--footer-compact-spacer-height, ${effectiveCompactSpacerHeight}px)` : effectiveCompactSpacerHeight;
  const ctaProps = {
    showMarketingCta,
    showCopyright,
    marketingCtaTitle,
    marketingCtaDescription,
    marketingCtaPrimary,
    marketingCtaSecondary,
    footerContainerNudge,
    footerContainerTransform,
    layoutVariant,
  };
  if (!standalone) {
    return (
      <WebflowFooterContent
        activePathname={activePathname}
        isMobile={isMobile}
        showSocialLinks={showSocialLinks}
        containerWfEl={containerWfEl}
        {...ctaProps}
      />
    );
  }

  return (
    // Live's footer is rendered as `<section class="section u-bg-primary">`
    // (a SECTION, not a FOOTER element).  Use `<section>` here so the
    // parity container inventory matches: live has N sections and zero
    // footers; we want the same totals.
    <section
      data-wf-el='section'
      className='section u-bg-primary relative overflow-visible bg-brand-accent text-brand-fg footer-webflow-layout'
      style={{ padding: isManifestoMobile ? '49.5714px 0px' : 'var(--footer-section-padding, var(--product-section-padding-y, var(--section-padding-y))) 0px', height: isManifesto ? (isManifestoMobile ? '1370.58px' : '1209.38px') : 'var(--footer-section-height, auto)' }}
    >
      <div data-wf-el='asci-wrap' className='absolute inset-0 overflow-hidden' style={{ maxHeight: 'none', pointerEvents: 'auto' }}>
        <PixelBlastBackground />
      </div>
      <div
        data-wf-el={standaloneContainerHeight ? 'container' : undefined}
        className={standaloneContainerHeight ? 'relative z-10 mx-auto max-w-[1238px]' : 'relative z-10 w-full'}
        style={standaloneContainerHeight ? { height: `${standaloneContainerHeight}px` } : undefined}
      >
        <WebflowFooterContent
          activePathname={activePathname}
          isMobile={isMobile}
          showSocialLinks={showSocialLinks}
          containerWfEl={standaloneContainerHeight ? null : undefined}
          containerStyle={standaloneContainerHeight ? { width: '100%' } : undefined}
          {...ctaProps}
        />
      </div>
      {standaloneContainerHeight ? <div aria-hidden='true' style={{ height: `${standaloneContainerFlowSpacerHeight}px` }} /> : null}
      {compactNav && effectiveCompactSpacerHeight > 0 && compactSpacerCssHeight ? (
        <div aria-hidden='true' style={{ height: compactSpacerCssHeight }} />
      ) : null}
    </section>
  );
};
