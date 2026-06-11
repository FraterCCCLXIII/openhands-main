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
  webflowLayout?: boolean;
  showMarketingCta?: boolean;
  marketingCtaTitle?: string;
  marketingCtaDescription?: string;
  marketingCtaPrimary?: FooterCta;
  marketingCtaSecondary?: FooterCta | null;
}

const DEFAULT_CTA_TITLE = 'Building the open standard for autonomous software development.';
const DEFAULT_CTA_DESCRIPTION =
  'OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.';
const DEFAULT_CTA_PRIMARY: FooterCta = { href: FOOTER_COMMUNITY_CTA.href, label: FOOTER_COMMUNITY_CTA.label };
const DEFAULT_CTA_SECONDARY: FooterCta | null = null;

interface FooterCtaBlockProps {
  title: string;
  description: string;
  primary: FooterCta;
  secondary: FooterCta | null;
}

const FooterCtaBlock = ({ title, description, primary, secondary }: FooterCtaBlockProps) => (
  <div
    className='mx-auto flex flex-col items-center'
    style={{ maxWidth: '852px', paddingLeft: '20px', paddingRight: '20px', textAlign: 'center' }}
  >
    <div className='section-title' style={{ marginBottom: '22px' }}>
      {title}
    </div>
    <p className='fluid-body-lg font-medium text-brand-muted' style={{ margin: 0 }}>
      {description}
    </p>
    <div className='mb-12 flex flex-wrap items-center justify-center gap-4' style={{ marginTop: '49.6px' }}>
      <OverlayLinkButton href={primary.href} label={primary.label} variant='primary' wfEl='button' textWfEl='btn-text' />
      {secondary ? (
        <OverlayLinkButton href={secondary.href} label={secondary.label} variant='outline' wfEl='button' textWfEl='btn-text' />
      ) : null}
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
  | 'showCopyright'
  | 'footerContainerNudge'
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
  showCopyright = true,
  footerContainerNudge,
  footerContainerTransform,
  containerWfEl = null,
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
  const isContactActive = normalizePathname('/contact') === activePathname;

  return (
    <div data-wf-el={containerWfEl ?? undefined} className='container u-position-relative u-z-index-1' style={footerContainerStyle}>
      <div style={{ transform: isManifestoMobile ? 'none' : 'var(--footer-content-transform, none)' }}>
        <div
          className='row row-justify-center u-mb-md'
          style={{
            ...FOOTER_ROW_STYLE,
            justifyContent: 'center',
            marginTop: isManifestoMobile ? '64px' : 'var(--footer-social-margin-top, 80px)',
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
  standalone: _standalone = true,
  showSocialLinks = false,
  compactNav = false,
  compactNavSpacerHeight,
  standaloneContainerHeight: _standaloneContainerHeight,
  standaloneContainerFlowSpacerHeight: _standaloneContainerFlowSpacerHeight = 1,
  minHeight: _minHeight,
  compactSpacerHeight = 0,
  showMarketingCta: _showMarketingCta = true,
  showCopyright = true,
  footerContainerNudge,
  marketingCtaTitle,
  marketingCtaDescription,
  marketingCtaPrimary,
  marketingCtaSecondary,
  footerContainerTransform,
  containerWfEl = null,
  layoutVariant = 'default',
}: FooterProps) => {
  const activePathname = normalizePathname(useLocation().pathname);
  const width = useWidth();
  const isMobile = width < 768;
  const isManifesto = layoutVariant === 'manifesto';
  const isManifestoMobile = isManifesto && isMobile;
  const effectiveCompactSpacerHeight = isManifestoMobile ? 9.21 : compactSpacerHeight;
  const compactSpacerCssHeight =
    typeof effectiveCompactSpacerHeight === 'number'
      ? `var(--footer-compact-spacer-height, ${effectiveCompactSpacerHeight}px)`
      : effectiveCompactSpacerHeight;
  const resolvedMarketingCtaPrimary = marketingCtaPrimary ?? DEFAULT_CTA_PRIMARY;
  const resolvedMarketingCtaSecondary = marketingCtaSecondary ?? DEFAULT_CTA_SECONDARY;

  return (
    <section
      data-wf-el='section'
      className='section u-bg-primary footer-webflow-layout relative overflow-visible bg-brand-accent text-center text-brand-fg'
      style={{
        display: 'block',
        backgroundColor: 'rgb(255, 255, 139)',
        padding: isManifestoMobile ? '49.5714px 0px' : '80px 0px',
        position: 'relative',
        height: isManifesto ? (isManifestoMobile ? '1370.58px' : '1209.38px') : 'auto',
      }}
    >
      <div data-wf-el='asci-wrap' className='absolute inset-0 overflow-hidden' style={{ pointerEvents: 'auto' }}>
        <PixelBlastBackground />
      </div>
      <div
        data-wf-el='container'
        className='relative z-10 mx-auto max-w-[1238px]'
        style={{ marginTop: isManifestoMobile ? undefined : '49.6px' }}
      >
        <FooterCtaBlock
          title={marketingCtaTitle ?? DEFAULT_CTA_TITLE}
          description={marketingCtaDescription ?? DEFAULT_CTA_DESCRIPTION}
          primary={resolvedMarketingCtaPrimary}
          secondary={resolvedMarketingCtaSecondary}
        />
        <div className='mt-12 md:mt-20'>
          <WebflowFooterContent
            activePathname={activePathname}
            isMobile={isMobile}
            showSocialLinks={showSocialLinks}
            showCopyright={showCopyright}
            footerContainerNudge={footerContainerNudge}
            footerContainerTransform={footerContainerTransform}
            containerWfEl={containerWfEl}
            layoutVariant={layoutVariant}
          />
        </div>
      </div>
      {compactNav && effectiveCompactSpacerHeight > 0 && compactSpacerCssHeight ? (
        <div aria-hidden='true' style={{ height: compactSpacerCssHeight }} />
      ) : null}
    </section>
  );
};
