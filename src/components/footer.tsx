import { Link, useLocation } from 'react-router';
import clsx from 'clsx';
import { FOOTER_NAV_ITEMS, FOOTER_RESOURCE_LINKS } from '~/constants/site-shell';
import { normalizePathname } from '~/utils/normalize-pathname';
import { OverlayLinkButton } from '~/components/overlay-link-button';

interface FooterCta {
  href: string;
  label: string;
}

interface FooterProps {
  standalone?: boolean;
  showSocialLinks?: boolean;
  compactNav?: boolean;
  compactNavSpacerHeight?: number;
  standaloneContainerHeight?: number;
  standaloneContainerFlowSpacerHeight?: number;
  navWidthClass?: string;
  minHeight?: number;
  compactSpacerHeight?: number;
  showCopyright?: boolean;
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
 * paragraph + Build with SDK / Try it live buttons that live
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
const DEFAULT_CTA_PRIMARY: FooterCta = { href: 'https://docs.openhands.dev/sdk', label: 'Build with SDK' };
const DEFAULT_CTA_SECONDARY: FooterCta = { href: 'https://app.all-hands.dev/', label: 'Try it live' };

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


const footerNavLinkStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '4.8px',
  padding: '14.4px 5px',
  fontSize: '16px',
  fontWeight: 500,
  lineHeight: '22.4px',
  whiteSpace: 'nowrap',
  textAlign: 'start',
} as const;

const footerResourceLinkStyle = {
  paddingLeft: '5px',
  paddingRight: '5px',
  fontFamily: '"Sohne Buch", "Sohne Kraftig", Arial, sans-serif',
  fontSize: '14px',
  fontWeight: 400,
  lineHeight: '19.6px',
  textAlign: 'start',
} as const;

type WebflowFooterContentProps = Pick<
  FooterProps,
  | 'showSocialLinks'
  | 'showMarketingCta'
  | 'showCopyright'
  | 'compactNavSpacerHeight'
  | 'marketingCtaTitle'
  | 'marketingCtaDescription'
  | 'marketingCtaPrimary'
  | 'marketingCtaSecondary'
> & {
  containerWfEl?: string | null;
  containerStyle?: React.CSSProperties;
};

const WebflowFooterContent = ({
  showSocialLinks = false,
  showMarketingCta = true,
  showCopyright = true,
  marketingCtaTitle,
  marketingCtaDescription,
  marketingCtaPrimary,
  marketingCtaSecondary,
  containerWfEl = 'container',
  containerStyle,
}: WebflowFooterContentProps) => {
  const location = useLocation();
  const pathname = normalizePathname(location.pathname);
  const currentYear = new Date().getFullYear();

  const renderTopLevelLink = (item: (typeof FOOTER_NAV_ITEMS)[number]) => {
    const isActive = normalizePathname(item.to) === pathname;
    return (
      <Link
        key={item.name}
        to={item.to}
        aria-current={isActive ? 'page' : undefined}
        data-wf-el='nav-link'
        className={clsx('nav-link link-hover hover:text-[#8a5f45] py-[14.4px]', isActive && 'text-[#8a5f45]')}
        style={footerNavLinkStyle}
      >
        {item.name}
      </Link>
    );
  };

  return (
    <div data-wf-el={containerWfEl ?? undefined} className='container u-position-relative u-z-index-1' style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1238px', marginLeft: 'auto', marginRight: 'auto', ...containerStyle }}>
      {showMarketingCta ? (
        <div className='row row-justify-center u-mt-md u-position-relative u-z-index-1' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', position: 'relative', zIndex: 1, marginTop: '50px' }}>
          <div className='col col-lg-8 col-sm-12' style={FOOTER_COL_LG_8_STYLE}>
            <div className='h2 u-text-center u-mb-xs section-title text-brand-fg' style={{ textAlign: 'center', marginBottom: '22px', letterSpacing: '-0.02em' }}>
              {marketingCtaTitle ?? DEFAULT_CTA_TITLE}
            </div>
            <p data-wf-el='paragraph-lg' className='u-m-0 u-text-darkgray u-text-center font-medium text-brand-muted' style={{ margin: '0px', textAlign: 'center', fontSize: '20.8px', lineHeight: '24.96px' }}>
              {marketingCtaDescription ?? DEFAULT_CTA_DESCRIPTION}
            </p>
            <div className='row row-gap-button u-mt-md row-justify-center' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', columnGap: '16px', rowGap: '16px', marginTop: '51px' }}>
              <div className='col col-shrink' style={FOOTER_COL_SHRINK_NO_PADDING_STYLE}>
                <OverlayLinkButton href={(marketingCtaPrimary ?? DEFAULT_CTA_PRIMARY).href} label={(marketingCtaPrimary ?? DEFAULT_CTA_PRIMARY).label} variant='primary' wfEl='button' textWfEl='btn-text' />
              </div>
              {marketingCtaSecondary !== null ? (
                <div className='col col-shrink' style={FOOTER_COL_SHRINK_NO_PADDING_STYLE}>
                  <OverlayLinkButton href={(marketingCtaSecondary ?? DEFAULT_CTA_SECONDARY).href} label={(marketingCtaSecondary ?? DEFAULT_CTA_SECONDARY).label} variant='outline' wfEl='button' textWfEl='btn-text' />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showSocialLinks ? (
        <div data-wf-el='footer-social-row' className='row u-mt-lg row-justify-center u-mb-md' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', marginTop: showMarketingCta ? '128px' : '80px', marginBottom: '49px', rowGap: '40px', textAlign: 'start' }}>
          <div className='col' style={FOOTER_COL_STYLE}>
            <div className='row row-gap-sm row-justify-center' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', columnGap: '8px', rowGap: '16px' }}>
              {SOCIAL_LINKS.map((item) => (
                <div key={item.label} className='col col-shrink' style={FOOTER_COL_SHRINK_NO_PADDING_STYLE}>
                  <a
                    href={item.href}
                    {...('external' in item && item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className='standard-media contain-center w-inline-block'
                    data-wf-el='standard-media'
                    data-testid='footer-social-link'
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '65px', height: '65px', maxWidth: '100%', textAlign: 'start', textDecoration: 'underline', textDecorationThickness: '1.6px', textUnderlineOffset: '1.6px', objectFit: 'contain' }}
                  >
                    <img data-wf-el='standard-media-img' src={item.icon} alt='' style={{ width: '65px', height: '65px', objectFit: 'scale-down', textUnderlineOffset: '1.6px' }} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className='row row-justify-center u-mb-sm' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', marginBottom: '24px' }}>
        <div className='col col-lg-8 col-md-12' style={FOOTER_COL_LG_8_STYLE}>
          <div data-wf-el='footer-nav' className='footer-nav justify-between' style={{ display: 'flex', flexFlow: 'row nowrap', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', paddingBottom: '16px', borderBottom: '1px solid #b3a88c', textAlign: 'start' }}>
            {FOOTER_NAV_ITEMS.map(renderTopLevelLink)}
            <div data-wf-el='footer-drop' id='footer-resources' className='footer-drop' style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', textAlign: 'start' }}>
              <a href='#footer-resources' data-wf-el='nav-link' className='nav-link hover:text-[#8a5f45]' style={footerNavLinkStyle}>
                Resources
              </a>
              {FOOTER_RESOURCE_LINKS.map((item) =>
                item.external ? (
                  <a key={item.name} href={item.to} target='_blank' rel='noopener noreferrer' data-wf-el='footer-nav-link' className='footer-nav-link buch hover:text-[#8a5f45]' style={footerResourceLinkStyle}>
                    {item.name}
                  </a>
                ) : (
                  <Link key={item.name} to={item.to} data-wf-el='footer-nav-link' className='footer-nav-link buch hover:text-[#8a5f45]' style={footerResourceLinkStyle}>
                    {item.name}
                  </Link>
                ),
              )}
            </div>
            <Link
              to='/contact'
              aria-current={normalizePathname('/contact') === pathname ? 'page' : undefined}
              data-wf-el='nav-link'
              className={clsx('nav-link link-hover hover:text-[#8a5f45] py-[14.4px]', normalizePathname('/contact') === pathname && 'text-[#8a5f45]')}
              style={footerNavLinkStyle}
            >
              Contact
            </Link>
          </div>
        </div>
      </div>

      <div className='row row-justify-center u-mb-md' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', marginBottom: '40px' }}>
        <div className='col col-lg-8' style={FOOTER_COL_LG_8_STYLE}>
          {showCopyright ? (
            <div data-wf-el='eyebrow' className='eyebrow u-text-center' style={{ textAlign: 'center', marginBottom: '21.12px', fontFamily: 'GeistMono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '14px', fontWeight: 400, lineHeight: '16.896px', wordSpacing: '0.2px' }}>
              <span style={{ display: 'inline-block', transform: 'scaleX(1.0038)', transformOrigin: 'center' }}>© <span data-year=' '>{currentYear}</span> OpenHands - All rights reserved</span>
            </div>
          ) : (
            <span className='sr-only'>© {currentYear} OpenHands - All rights reserved</span>
          )}
          <Link
            to='/privacy'
            data-wf-el='eyebrow'
            className='eyebrow u-text-center is-link hover:text-[#8a5f45]'
            style={{ alignSelf: 'center', display: 'block', textAlign: 'center', marginBottom: '21.12px', fontFamily: 'GeistMono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '14px', fontWeight: 400, lineHeight: '16.896px', textDecoration: 'none', cursor: 'pointer' }}
          >
            Privacy Policy
          </Link>
        </div>
        <div className='col col-lg-8' style={{ ...FOOTER_COL_LG_8_STYLE, marginTop: '39px' }}>
          <div className='row row-gap-sm row-justify-center' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', rowGap: '16px' }}>
            <div className='col col-shrink' style={FOOTER_COL_SHRINK_STYLE}>
              <div data-wf-el='standard-media' className='standard-media contain-center' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'start', width: '610px', height: '102px', objectFit: 'contain' }}>
                <img data-wf-el='standard-media-img' src='/assets/webflow/backgrounds/openhands_logo_black.svg' alt='' style={{ display: 'block', width: '610px', height: '102px', textAlign: 'start', objectFit: 'scale-down' }} />
              </div>
            </div>
          </div>
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
  compactSpacerHeight = compactNavSpacerHeight ?? 50,
  showMarketingCta = true,
  showCopyright = true,
  marketingCtaTitle,
  marketingCtaDescription,
  marketingCtaPrimary,
  marketingCtaSecondary,
}: FooterProps) => {
  const ctaProps = {
    showMarketingCta,
    showCopyright,
    marketingCtaTitle,
    marketingCtaDescription,
    marketingCtaPrimary,
    marketingCtaSecondary,
  };
  if (!standalone) {
    return (
      <WebflowFooterContent
        showSocialLinks={showSocialLinks}
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
      className='relative overflow-visible bg-brand-accent text-brand-fg'
      style={{ padding: '80px 0px' }}
    >
      <div data-wf-el='asci-wrap' className='absolute inset-0 overflow-hidden'>
        <img
          data-wf-el='asci-media'
          src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
          alt=''
          loading='lazy'
          decoding='async'
          className='h-full w-full object-cover'
          style={{ display: 'inline-block', textAlign: 'start' }}
        />
      </div>
      <div
        data-wf-el={standaloneContainerHeight ? 'container' : undefined}
        className={standaloneContainerHeight ? 'relative z-10 mx-auto max-w-[1238px]' : 'relative z-10 w-full'}
        style={standaloneContainerHeight ? { height: `${standaloneContainerHeight}px` } : undefined}
      >
        <WebflowFooterContent
          showSocialLinks={showSocialLinks}
          containerWfEl={standaloneContainerHeight ? null : undefined}
          {...ctaProps}
        />
      </div>
      {standaloneContainerHeight ? <div aria-hidden='true' style={{ height: `${standaloneContainerFlowSpacerHeight}px` }} /> : null}
      {compactNav && compactSpacerHeight > 0 ? <div aria-hidden='true' style={{ height: `${compactSpacerHeight}px` }} /> : null}
    </section>
  );
};
