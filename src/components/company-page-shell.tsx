import type { CSSProperties, ReactNode } from 'react';
import { useLocation } from 'react-router';
import { Footer } from '~/components/footer';
import { getRouteLayoutConfig, toFooterProps } from '~/constants/route-layout';
import { PixelBlastBackground } from '~/components/pixel-blast-background';

const opacityFromClassName = (className: string) => className.match(/opacity-\[([\d.]+)\]/)?.[1] ?? '0.12';

interface CompanyPageShellProps {
  children: ReactNode;
  backgroundClassName?: string;
  showBackground?: boolean;
  mainClassName?: string;
  layoutPath?: string;
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
  mainClassName,
  layoutPath,
}: CompanyPageShellProps) => {
  const location = useLocation();
  const routeLayout = getRouteLayoutConfig(layoutPath ?? location.pathname);
  const spacerHeight = routeLayout.footer.shellTrailingSpacerHeight ?? 19;

  return (
    <main data-wf-el='page-main' className={['relative overflow-visible', mainClassName].filter(Boolean).join(' ')} style={{ display: 'flex', flexDirection: 'column', position: 'static' }}>
      {showBackground ? (
        <div
          aria-hidden='true'
          data-testid='company-page-background'
          className={`pointer-events-auto absolute inset-0 overflow-hidden ${backgroundClassName}`}
          style={{ '--ascii-opacity': opacityFromClassName(backgroundClassName) } as CSSProperties}
        >
          <PixelBlastBackground className='h-full w-full' />
        </div>
      ) : null}
      <div className='relative'>{children}</div>
      <Footer {...toFooterProps(routeLayout.footer)} />
      {spacerHeight > 0 ? <div aria-hidden='true' className='company-page-shell-trailing-spacer' style={{ height: `${spacerHeight}px` }} /> : null}
    </main>
  );
};
