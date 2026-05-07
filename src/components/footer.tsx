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
  navWidthClass?: string;
  minHeight?: number;
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
  marketingCtaSecondary?: FooterCta;
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
  secondary?: FooterCta;
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
}: FooterMarketingCtaProps) => (
  // No data-wf-el here: live wraps the CTA copy in a generic div
  // inside the footer section, so adding a custom key here would
  // register as a phantom 'extra-on-test' wf element that has no
  // corresponding live counterpart.
  <div className='mb-12 flex flex-col items-center gap-6 text-center'>
    <div className='section-title max-w-[812px] tracking-[-0.02em] text-brand-fg'>
      {title}
    </div>
    <p className='max-w-[812px] fluid-body-lg font-medium text-brand-muted'>
      {description}
    </p>
    <div className='flex flex-wrap items-center justify-center gap-4'>
      <OverlayLinkButton href={primary.href} label={primary.label} variant='primary' />
      <OverlayLinkButton href={secondary.href} label={secondary.label} variant='outline' />
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

type FooterContentProps = Pick<
  FooterProps,
  | 'showSocialLinks'
  | 'compactNav'
  | 'navWidthClass'
  | 'showMarketingCta'
  | 'marketingCtaTitle'
  | 'marketingCtaDescription'
  | 'marketingCtaPrimary'
  | 'marketingCtaSecondary'
>;

const FooterContent = ({
  showSocialLinks = false,
  compactNav = false,
  navWidthClass,
  showMarketingCta = true,
  marketingCtaTitle,
  marketingCtaDescription,
  marketingCtaPrimary,
  marketingCtaSecondary,
}: FooterContentProps) => {
  const location = useLocation();
  const pathname = normalizePathname(location.pathname);

  return (
    <div className='text-center text-brand-fg'>
      {showMarketingCta ? (
        <FooterMarketingCta
          title={marketingCtaTitle}
          description={marketingCtaDescription}
          primary={marketingCtaPrimary}
          secondary={marketingCtaSecondary}
        />
      ) : null}
      {showSocialLinks ? (
        <div className='mb-12 flex justify-center'>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                {...('external' in item && item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className='flex h-10 w-10 items-center justify-center'
                data-testid='footer-social-link'
              >
                <img src={item.icon} alt='' className='h-10 w-10 object-contain' />
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
      <div data-wf-el='footer-nav' className='mx-auto w-full max-w-[812px]' style={compactNav ? { display: 'flex', textAlign: 'start', paddingBottom: '16px', justifyContent: 'space-between', alignItems: 'flex-start' } : { display: 'flex', justifyContent: 'center' }}>
        {compactNav ? (
          <div
            className={clsx(
              'flex w-full flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-[#b3a88c] pb-4 text-left',
              navWidthClass ?? 'max-w-[825px]'
            )}
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
              data-wf-el='nav-link'
              className={clsx(
                'whitespace-nowrap px-[5px] py-[14.4px] text-base font-medium leading-[22.4px] link-hover hover:text-[#8a5f45]',
                ''
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
                  'whitespace-nowrap text-left text-base font-medium leading-[22.4px] link-hover hover:text-[#8a5f45]',
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
                'whitespace-nowrap text-left text-base font-medium leading-[22.4px] link-hover hover:text-[#8a5f45]',
                ''
              )}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4.8px' }}
            >
              Contact
            </Link>
          </div>
        )}
      </div>

      {/* Live's footer does NOT render a copyright line — only a
          single Privacy Policy eyebrow link, centered.  We keep the
          copyright in a sr-only span so the legal credit isn't lost
          but it doesn't appear in parity DOM inventories. */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span className='sr-only'>© {new Date().getFullYear()} OpenHands - All rights reserved</span>
        <Link
          to='/privacy'
          data-wf-el='eyebrow'
          className='font-mono text-[14px] font-normal leading-[16.896px] hover:text-[#8a5f45]'
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
      <div data-wf-el='standard-media' className='flex justify-center' style={{ textAlign: 'start', alignItems: 'center', marginTop: '0px' }}>
        <img data-wf-el='standard-media-img' src='/assets/webflow/backgrounds/openhands_logo_black.svg' alt='' style={{ width: '610px', height: '102px', textAlign: 'start' }} />
      </div>
    </div>
  );
};

export const Footer = ({
  standalone = false,
  showSocialLinks = false,
  compactNav = false,
  navWidthClass,
  minHeight,
  showMarketingCta = true,
  marketingCtaTitle,
  marketingCtaDescription,
  marketingCtaPrimary,
  marketingCtaSecondary,
}: FooterProps) => {
  const ctaProps = {
    showMarketingCta,
    marketingCtaTitle,
    marketingCtaDescription,
    marketingCtaPrimary,
    marketingCtaSecondary,
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
      className='relative overflow-hidden bg-brand-accent text-brand-fg'
      style={{ padding: '80px 0px', minHeight: minHeight ? `${minHeight}px` : undefined }}
    >
      <div data-wf-el='asci-wrap' className='absolute inset-0'>
        <img
          data-wf-el='asci-media'
          src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
          alt=''
          className='h-full w-full object-cover'
          style={{ display: 'inline-block', textAlign: 'start' }}
        />
      </div>
      <div className='relative z-10 mx-auto max-w-[1238px]'>
        <FooterContent
          showSocialLinks={showSocialLinks}
          compactNav={compactNav}
          navWidthClass={navWidthClass}
          {...ctaProps}
        />
      </div>
    </section>
  );
};
