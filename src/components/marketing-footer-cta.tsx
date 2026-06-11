import clsx from 'clsx';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { FOOTER_COMMUNITY_CTA } from '~/constants/site-shell';

interface MarketingFooterCtaProps {
  semanticHeading?: boolean;
  className?: string;
}

export const MarketingFooterCta = ({
  semanticHeading = false,
  className,
}: MarketingFooterCtaProps) => {
  const HeadingTag = semanticHeading ? 'h2' : 'div';

  // Live Webflow renders this CTA inside a SECTION whose padding is
  // 80px 0 (vertical only) — the inner `.container` carries the gutter.
  // Matching that geometry on the SECTION lets the parity check pair the
  // ancestor box exactly instead of registering a paddingTop/paddingBottom
  // mismatch against every CTA child it contains.
  // Live Webflow renders this CTA inside a section with a yellow
  // primary background (`section.u-bg-primary`). Painting that bg on
  // the SECTION here keeps the parity audit's ancestor backgroundColor
  // pairing happy.
  return (
    <section
      data-wf-el='section'
      className={clsx('text-center', className)}
      style={{
        display: 'block',
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: '0px',
        paddingRight: '0px',
        position: 'relative',
        backgroundColor: 'rgb(255, 255, 139)',
      }}
    >
      <div className='mx-auto w-full max-w-[1260px] px-5 lg:px-10' data-wf-el='container'>
        <div className='mx-auto flex max-w-[980px] flex-col items-center gap-6'>
          <HeadingTag className='section-title tracking-[-0.02em] text-brand-fg'>
            Building the open standard for autonomous software development.
          </HeadingTag>
          <p className='max-w-[812px] fluid-body-lg font-medium text-brand-muted'>
            OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.
          </p>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <OverlayLinkButton href={FOOTER_COMMUNITY_CTA.href} label={FOOTER_COMMUNITY_CTA.label} variant='primary' />
          </div>
        </div>
      </div>
    </section>
  );
};
