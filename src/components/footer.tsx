import { Link, useLocation } from 'react-router';
import clsx from 'clsx';
import { FOOTER_NAV_ITEMS, FOOTER_RESOURCE_LINKS } from '~/constants/site-shell';
import { normalizePathname } from '~/utils/normalize-pathname';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { AGENT_CANVAS_DOWNLOAD_URL, OPENHANDS_DOCS_URL } from '~/constants/product-links';

interface FooterCta {
  href: string;
  label: string;
}

interface FooterProps {
  standalone?: boolean;
  showSocialLinks?: boolean;
  compactNav?: boolean;
  navWidthClass?: string;
  minHeight?: number;
  showCopyright?: boolean;
  /**
   * Render the legacy Webflow footer grid/row structure used by the
   * whitepaper page. Other routes keep the existing compact React layout
   * because their live footer variants intentionally omit the copyright row.
   */
  webflowLayout?: boolean;
  showCopyright?: boolean;
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
  showCopyright?: boolean;
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
const DEFAULT_CTA_PRIMARY: FooterCta = { href: AGENT_CANVAS_DOWNLOAD_URL, label: 'Download Agent Canvas' };
const DEFAULT_CTA_SECONDARY: FooterCta = { href: OPENHANDS_DOCS_URL, label: 'See developer docs' };

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
} as const;

const footerResourceLinkStyle = {
  paddingLeft: '5px',
  paddingRight: '5px',
  fontFamily: '"Sohne Buch", "Sohne Kraftig", Arial, sans-serif',
  fontSize: '14px',
  fontWeight: 400,
  lineHeight: '19.6px',
} as const;

type WebflowFooterContentProps = Pick<
  FooterProps,
  | 'showSocialLinks'
  | 'showMarketingCta'
  | 'showCopyright'
  | 'marketingCtaTitle'
  | 'marketingCtaDescription'
  | 'marketingCtaPrimary'
  | 'marketingCtaSecondary'
>;

const WebflowFooterContent = ({
  showSocialLinks = false,
  showMarketingCta = true,
  showCopyright = false,
  marketingCtaTitle,
  marketingCtaDescription,
  marketingCtaPrimary,
  marketingCtaSecondary,
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
        className={clsx('nav-link link-hover hover:text-[#8a5f45]', isActive && 'text-[#8a5f45]')}
        style={footerNavLinkStyle}
      >
        {item.name}
      </Link>
    );
  };

  return (
    <div data-wf-el='container' className='container u-position-relative u-z-index-1' style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1238px', marginLeft: 'auto', marginRight: 'auto' }}>
      {showMarketingCta ? (
        <div className='row row-justify-center u-mt-md u-position-relative u-z-index-1' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', position: 'relative', zIndex: 1, marginTop: '49px' }}>
          <div className='col col-lg-8 col-sm-12' style={FOOTER_COL_LG_8_STYLE}>
            <div className='h2 u-text-center u-mb-xs section-title text-brand-fg' style={{ textAlign: 'center', marginBottom: '22px', letterSpacing: '-0.02em' }}>
              {marketingCtaTitle ?? DEFAULT_CTA_TITLE}
            </div>
            <p data-wf-el='paragraph-lg' className='u-m-0 u-text-darkgray u-text-center font-medium text-brand-muted' style={{ margin: '0px', textAlign: 'center', fontSize: '20.8px', lineHeight: '24.96px' }}>
              {marketingCtaDescription ?? DEFAULT_CTA_DESCRIPTION}
            </p>
            <div className='row row-gap-button u-mt-md row-justify-center' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', columnGap: '16px', rowGap: '16px', marginTop: '51px' }}>
              <div className='col col-shrink' style={FOOTER_COL_SHRINK_NO_PADDING_STYLE}>
                <OverlayLinkButton href={(marketingCtaPrimary ?? DEFAULT_CTA_PRIMARY).href} label={(marketingCtaPrimary ?? DEFAULT_CTA_PRIMARY).label} variant='primary' />
              </div>
              {marketingCtaSecondary !== null ? (
                <div className='col col-shrink' style={FOOTER_COL_SHRINK_NO_PADDING_STYLE}>
                  <OverlayLinkButton href={(marketingCtaSecondary ?? DEFAULT_CTA_SECONDARY).href} label={(marketingCtaSecondary ?? DEFAULT_CTA_SECONDARY).label} variant='outline' />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showSocialLinks ? (
        <div data-wf-el='footer-social-row' className='row u-mt-lg row-justify-center u-mb-md' style={{ ...FOOTER_ROW_STYLE, justifyContent: 'center', marginTop: '128px', marginBottom: '49px', rowGap: '40px', textAlign: 'start' }}>
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
          <div data-wf-el='footer-nav' className='footer-nav' style={{ display: 'flex', flexFlow: 'row nowrap', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', paddingBottom: '16px', borderBottom: '1px solid #b3a88c' }}>
            {FOOTER_NAV_ITEMS.map(renderTopLevelLink)}
            <div data-wf-el='footer-drop' id='footer-resources' className='footer-drop' style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
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
              className={clsx('nav-link link-hover hover:text-[#8a5f45]', normalizePathname('/contact') === pathname && 'text-[#8a5f45]')}
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
            <div data-wf-el='eyebrow' className='eyebrow u-text-center' style={{ textAlign: 'center', marginBottom: '21.12px', fontFamily: 'GeistMono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '14px', fontWeight: 400, lineHeight: '16.896px' }}>
              © <span data-year=' '>{currentYear}</span> OpenHands - All rights reserved
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
        <div className='col col-lg-8' style={{ ...FOOTER_COL_LG_8_STYLE, marginTop: '40px' }}>
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

type FooterContentProps = Pick<
  FooterProps,
  | 'showSocialLinks'
  | 'compactNav'
  | 'navWidthClass'
  | 'showMarketingCta'
  | 'showCopyright'
  | 'marketingCtaTitle'
  | 'marketingCtaDescription'
  | 'marketingCtaPrimary'
  | 'marketingCtaSecondary'
  | 'showCopyright'
>;

const FooterContent = ({
  showSocialLinks = false,
  compactNav = false,
  navWidthClass,
  showMarketingCta = true,
  showCopyright = false,
  marketingCtaTitle,
  marketingCtaDescription,
  marketingCtaPrimary,
  marketingCtaSecondary,
  showCopyright = false,
}: FooterContentProps) => {
  const location = useLocation();
  const pathname = normalizePathname(location.pathname);

  return (
    <div className='text-center text-brand-fg' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {showMarketingCta ? (
        <FooterMarketingCta
          title={marketingCtaTitle}
          description={marketingCtaDescription}
          primary={marketingCtaPrimary}
          secondary={marketingCtaSecondary}
          bottomMargin={showSocialLinks ? 0 : 127}
        />
      ) : null}
      {showSocialLinks ? (
        <div
          data-wf-el='footer-social-row'
          className='mb-12 flex justify-center'
          style={{ marginTop: '128px', marginLeft: '-20px', marginRight: '-20px', rowGap: '40px', textAlign: 'start' }}
        >
          <div className='flex flex-wrap items-center justify-center gap-2'>
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                {...('external' in item && item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className='flex items-center justify-center'
                style={{ width: '65px', height: '65px', maxWidth: '100%', textAlign: 'start', textDecoration: 'underline', textDecorationThickness: '1.6px', textUnderlineOffset: '1.6px', objectFit: 'contain' }}
                data-wf-el='standard-media'
                data-testid='footer-social-link'
              >
                <img data-wf-el='standard-media-img' src={item.icon} alt='' style={{ width: '65px', height: '65px', objectFit: 'scale-down', textUnderlineOffset: '1.6px' }} />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {/* Live's `.footer-nav` has `margin-bottom: 0` (the Tailwind `mb-8`
       * was a leftover that pushed the social row 32px lower than live).
       * Spacing between the nav and the social row comes from the row's
       * own padding, not this wrapper. */}
      {/* Live's footer chain is `.container` (1238) > `.row.row-justify-center`
        * (1278, flex justify-center) > `.col.col-lg-8` (852, padding 0 20px)
        * > `.footer-nav` (812, flex space-between).  We collapse those
        * intermediate Webflow grid layers down to a single 812px-wide
        * centered flex row so our nav-link inventory lines up with
        * live's positions. */}
      <div className='flex justify-center'>
      <div data-wf-el='footer-nav' className='w-full' style={compactNav ? { display: 'flex', textAlign: 'start', paddingBottom: '16px', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #b3a88c', width: '812px', maxWidth: 'none' } : { display: 'flex', justifyContent: 'center' }}>
        {compactNav ? (
          <div
            data-wf-el='footer-nav'
            className='flex w-[812px] items-start justify-between text-left'
            style={{ textAlign: 'start', paddingBottom: '16px', borderBottom: '1px solid #b3a88c' }}
          >
            {FOOTER_NAV_ITEMS.map((item) => {
              const isActive = normalizePathname(item.to) === pathname;
              return (
                <Link
                  key={item.name}
                  to={item.to}
                  aria-current={isActive ? 'page' : undefined}
                  data-wf-el='nav-link'
                  className={clsx(
                    'whitespace-nowrap px-[5px] py-[14.4px] text-base font-medium leading-[22.4px] link-hover hover:text-[#8a5f45]',
                    isActive && 'text-[#8a5f45]'
                  )}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4.8px' }}
                >
                  {item.name}
                </Link>
              );
            })}

            <div data-wf-el='footer-drop' id='footer-resources' className='flex flex-col items-start' style={{ justifyContent: 'flex-start' }}>
              {/* Live tags the Resources trigger with .nav-link so that
                * the footer's nav-link inventory has 7 entries (Home,
                * Product, Enterprise, Pricing, About, Resources,
                * Contact), matching what we render here. */}
              <a
                href='#footer-resources'
                data-wf-el='nav-link'
                className='px-[5px] text-base font-medium hover:text-[#8a5f45]'
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4.8px', lineHeight: '22.4px', textAlign: 'start', whiteSpace: 'nowrap', paddingTop: '14.5px', paddingBottom: '14.5px' }}
              >
                Resources
              </a>
              {FOOTER_RESOURCE_LINKS.map((item) =>
                item.external ? (
                  <a
                    key={item.name}
                    href={item.to}
                    target='_blank'
                    rel='noopener noreferrer'
                    data-wf-el='footer-nav-link'
                    className='px-[5px] font-sohne-buch text-[14px] font-normal leading-[19.6px] hover:text-[#8a5f45]'
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.to}
                    data-wf-el='footer-nav-link'
                    className='px-[5px] font-sohne-buch text-[14px] font-normal leading-[19.6px] hover:text-[#8a5f45]'
                  >
                    {item.name}
                  </Link>
                ),
              )}
            </div>

            <Link
              to='/contact'
              aria-current={normalizePathname('/contact') === pathname ? 'page' : undefined}
              data-wf-el='nav-link'
              className={clsx(
                'whitespace-nowrap px-[5px] py-[14.4px] text-base font-medium leading-[22.4px] link-hover hover:text-[#8a5f45]',
                normalizePathname('/contact') === pathname && 'text-[#8a5f45]'
              )}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4.8px' }}
            >
              Contact
            </Link>
            </div>
          ) : (
            <div
              className={clsx(
                'flex w-full flex-wrap items-start justify-center gap-x-16 gap-y-3 text-sm leading-[20.8px]',
                navWidthClass ?? 'max-w-[1060px]'
              )}
            >
            {FOOTER_NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                data-wf-el='nav-link'
                className={clsx(
                  'whitespace-nowrap px-[5px] py-[14.4px] text-left text-base font-medium leading-[22.4px] link-hover hover:text-[#8a5f45]',
                  ''
                )}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4.8px' }}
              >
                {item.name}
              </Link>
            ))}

            <div data-wf-el='footer-drop' id='footer-resources' className='flex max-w-[220px] flex-wrap items-start gap-x-5 gap-y-2 text-left' style={{ justifyContent: 'flex-start' }}>
              {/* Live tags Resources with .nav-link too. */}
              <a href='#footer-resources' data-wf-el='nav-link' className='text-base font-medium hover:text-[#8a5f45]' style={{ display: 'block', fontFamily: '"Sohne Kraftig", Inter, Arial, sans-serif', lineHeight: '22.4px', textAlign: 'start', whiteSpace: 'nowrap', paddingTop: '14.5px', paddingBottom: '14.5px' }}>
                Resources
              </a>
              {FOOTER_RESOURCE_LINKS.map((item) =>
                item.external ? (
                  <a
                    key={item.name}
                    href={item.to}
                    target='_blank'
                    rel='noopener noreferrer'
                    data-wf-el='footer-nav-link'
                    className='font-sohne-buch text-[14px] font-normal leading-[19.6px] hover:text-[#8a5f45]'
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.to}
                    data-wf-el='footer-nav-link'
                    className='font-sohne-buch text-[14px] font-normal leading-[19.6px] hover:text-[#8a5f45]'
                  >
                    {item.name}
                  </Link>
                ),
              )}
            </div>

            <Link
              to='/contact'
              data-wf-el='nav-link'
              className={clsx(
                'whitespace-nowrap px-[5px] py-[14.4px] text-left text-base font-medium leading-[22.4px] link-hover hover:text-[#8a5f45]',
                ''
              )}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4.8px' }}
            >
              Contact
            </Link>
          </div>
        )}
        </div>
      </div>
      </div>
      </div>

      {/* Most local routes keep the copyright screen-reader-only, but routes
          whose live footer exposes the copyright can opt in with
          `showCopyright`. */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: compactNav ? '62px' : '0px' }}>
        {showCopyright ? (
          <div data-wf-el='eyebrow' className='font-mono text-[14px] font-normal leading-[16.896px]' style={{ textAlign: 'center', width: '812px', marginBottom: '21.12px' }}>
            © <span>{new Date().getFullYear()}</span> OpenHands - All rights reserved
          </div>
        ) : (
          <span className='sr-only'>© {new Date().getFullYear()} OpenHands - All rights reserved</span>
        )}
        <Link
          to='/privacy'
          data-wf-el='eyebrow'
          className='font-mono text-[14.08px] font-normal leading-[16.896px] hover:text-[#8a5f45]'
          style={{
            textAlign: 'center',
            textDecoration: 'none',
            textUnderlineOffset: '1.408px',
            alignSelf: 'center',
            cursor: 'pointer',
            marginBottom: '21.12px',
            display: 'block',
          }}
        >
          Privacy Policy
        </Link>
      </div>

      {/* Live's `.standard-media` has `margin-top: 0` — vertical
       * spacing above the big OpenHands wordmark comes from the
       * preceding row's bottom padding, not this wrapper's `mt-8`. */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div data-wf-el='standard-media' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'start', marginTop: '0px', marginLeft: '0px', marginRight: '0px', width: '610px', height: '102px', objectFit: 'contain' }}>
          <img data-wf-el='standard-media-img' src='/assets/webflow/backgrounds/openhands_logo_black.svg' alt='' style={{ display: 'block', width: '610px', height: '102px', textAlign: 'start', objectFit: 'scale-down' }} />
        </div>
      </div>

    </div>
  );
};

export const Footer = ({
  standalone = false,
  showSocialLinks = false,
  compactNav = false,
  navWidthClass,
  minHeight: _minHeight,
  showMarketingCta = true,
  showCopyright = false,
  marketingCtaTitle,
  marketingCtaDescription,
  marketingCtaPrimary,
  marketingCtaSecondary,
  showCopyright,
}: FooterProps) => {
  const ctaProps = {
    showMarketingCta,
    showCopyright,
    marketingCtaTitle,
    marketingCtaDescription,
    marketingCtaPrimary,
    marketingCtaSecondary,
    showCopyright,
  };
  if (!standalone) {
    return (
      <FooterContent
        showSocialLinks={showSocialLinks}
        compactNav={compactNav}
        navWidthClass={navWidthClass}
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
      <div data-wf-el='asci-wrap' className='absolute inset-0 overflow-hidden' style={{ maxHeight: '2400px' }}>
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
      <div data-wf-el='container' className='relative z-10 mx-auto max-w-[1238px]'>
        <FooterContent
          showSocialLinks={showSocialLinks}
          showCopyright={showCopyright}
          {...ctaProps}
        />
      </div>
      {compactNav ? <div aria-hidden='true' style={{ height: '50px' }} /> : null}
    </section>
  );
};
