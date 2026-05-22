import type { ReactNode } from 'react';
import { Footer } from '~/components/footer';

interface CompanyPageShellProps {
  children: ReactNode;
  backgroundClassName?: string;
  showBackground?: boolean;
  footerCompactSpacerHeight?: number;
  footerFlowSpacerHeight?: number;
  trailingSpacerHeight?: number;
}

/**
 * Shell for marketing/company routes.
 *
 * Live openhands.dev renders the entire page (hero + content + the closing
 * yellow `section.u-bg-primary` Footer/CTA block) as siblings inside one
 * `<main>` element. Rendering the Footer OUTSIDE this `<main>` would put
 * `<main>` short by ~1100-1200px versus live, cascading into a giant
 * `page-main` rect.height delta in the parity audit.
 *
 * To match live structure, we render the standalone Footer (which itself
 * contains the marketing CTA via `showMarketingCta=true`) as the LAST child
 * of this `<main>`. `RootLayout` skips its own Footer for routes that use
 * CompanyPageShell.
 */
export const CompanyPageShell = ({
  children,
  backgroundClassName = 'opacity-[0.12]',
  showBackground = true,
  footerCompactSpacerHeight,
  footerFlowSpacerHeight = 19,
  trailingSpacerHeight,
}: CompanyPageShellProps) => {
  const spacerHeight = trailingSpacerHeight ?? footerFlowSpacerHeight;

  return (
    <main data-wf-el='page-main' className='relative overflow-visible' style={{ display: 'flex', flexDirection: 'column', position: 'static' }}>
      {showBackground ? (
        <div
          aria-hidden='true'
          data-testid='company-page-background'
          className={`pointer-events-none absolute inset-0 bg-cover bg-top bg-no-repeat ${backgroundClassName}`}
          style={{
            backgroundImage:
              "url('/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png')",
          }}
        />
      ) : null}
      <div className='relative'>{children}</div>
      <Footer standalone compactNav showSocialLinks compactSpacerHeight={footerCompactSpacerHeight} />
      {spacerHeight > 0 ? <div aria-hidden='true' style={{ height: `${spacerHeight}px` }} /> : null}
    </main>
  );
};
