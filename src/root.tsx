import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useMatches,
  useRouteError,
} from 'react-router';
import { Analytics } from '@vercel/analytics/react';

import type { Route } from './+types/root';
import { motion } from 'framer-motion';
import React from 'react';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { MarketingFooterCta } from './components/marketing-footer-cta';
import { Sidebar } from './components/sidebar/sidebar';
import { PRODUCT_FEATURE_PAGES } from './data/product-feature-pages';
import { AGENT_CANVAS_DOWNLOAD_URL, OPENHANDS_DOCS_URL } from './constants/product-links';
import { GitHubModal } from './components/github-modal';
import { GitHubModalProvider } from './contexts/github-modal-context';
import { useWidth } from './hooks/use-media';
import { normalizePathname } from './utils/normalize-pathname';
import './index.css';
import { PHProvider } from './provider';

export const links: Route.LinksFunction = () => [
  {
    rel: 'icon',
    href: '/all-hands-logo-1.svg',
    type: 'image/svg+xml',
  },
  // Preload the primary local brand font used above the fold.
  {
    rel: 'preload',
    href: '/assets/fonts/Sohne-Kraftig.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
  // Preconnect to GitHub avatars
  {
    rel: 'preconnect',
    href: 'https://avatars.githubusercontent.com',
    crossOrigin: 'anonymous',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
        <script src="/reo-init.js" defer />
      </head>
      <body>
        <PHProvider>
          {children}
          <Analytics />
          <ScrollRestoration />
          <Scripts />
        </PHProvider>
      </body>
    </html>
  );
}

// Live openhands.dev no longer renders a marketing-footer CTA section
// before the global footer on /about, /contact, /manifesto, /press —
// they jump straight from the page content to the footer.  Keeping
// this path set empty preserves the boolean codepath while turning
// the CTA off everywhere it does not match live.
const MARKETING_FOOTER_PATHS = new Set<string>();

type FooterCtaOverride = {
  marketingCtaTitle?: string;
  marketingCtaDescription?: string;
  marketingCtaPrimary?: { href: string; label: string };
  marketingCtaSecondary?: { href: string; label: string };
};

const PRODUCT_SUBPAGE_CTA: Record<string, FooterCtaOverride> = {
  '/product/agent-canvas': buildProductCta('gui'),
  '/product/cli': buildProductCta('cli'),
  '/product/gui': buildProductCta('gui'),
  '/product/sdk': buildProductCta('sdk'),
  // Live /enterprise renders a page-specific CTA at the top of the
  // global footer's yellow section instead of the default marketing
  // copy; mirroring it here keeps our enterprise page from doubling
  // up the CTA (closing section + footer marketing block) and keeps
  // the rendered DOM structurally identical to live (one yellow
  // section containing the CTA + social + nav + ASCII art).
  '/enterprise': {
    marketingCtaTitle: 'What comes after Claude Code?',
    marketingCtaDescription:
      'The teams shipping the most are moving beyond individual agent sessions to governed, automated workflows. Let us show you what that looks like in practice.',
    marketingCtaPrimary: { href: '/contact', label: 'Book a Demo' },
    marketingCtaSecondary: { href: OPENHANDS_DOCS_URL, label: 'See developer docs' },
  },
  // Live /pricing renders the closing "Building the open standard…"
  // CTA inside the yellow footer section (`section.u-bg-primary`),
  // not as a separate section above it.  Threading the copy through
  // the Footer's marketingCta* props keeps our DOM in lockstep with
  // live (one yellow section instead of two stacked sections).
  '/pricing': {
    marketingCtaTitle:
      'Building the open standard for autonomous software development.',
    marketingCtaDescription:
      'OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.',
    marketingCtaPrimary: { href: AGENT_CANVAS_DOWNLOAD_URL, label: 'Download Agent Canvas' },
    marketingCtaSecondary: { href: OPENHANDS_DOCS_URL, label: 'See developer docs' },
  },
};

function buildProductCta(variant: 'cli' | 'gui' | 'sdk'): FooterCtaOverride {
  const page = PRODUCT_FEATURE_PAGES[variant];
  return {
    marketingCtaTitle: page.closingTitle,
    marketingCtaDescription: page.closingDescription,
    marketingCtaPrimary: page.closingPrimaryCta,
    marketingCtaSecondary: page.closingSecondaryCta,
  };
}

function productSubpageCtaProps(pathname: string) {
  return PRODUCT_SUBPAGE_CTA[pathname] ?? {};
}

export default function App() {
  const [isSidebarHidden, setIsSidebarHidden] = React.useState(true);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const location = useLocation();
  const matches = useMatches();
  const pathname = normalizePathname(location.pathname);
  const width = useWidth();
  const isDesktop = width >= 1024;
  const hideGlobalFooter = matches.some(
    (match) => (match.handle as { hideGlobalFooter?: boolean } | undefined)?.hideGlobalFooter,
  );
  // Routes that render their own Footer inside <main> (via CompanyPageShell).
  // Live openhands.dev places the closing yellow `section.u-bg-primary`
  // (CTA + footer nav) INSIDE `<main>` for these pages; rendering Footer
  // here in addition would put it outside `<main>` and create a
  // ~1100-1200px page-main height delta in the parity audit.
  const usesShellFooter = pathname === '/about' || pathname === '/press' || pathname === '/manifesto' || pathname === '/contact';
  const showGlobalFooter = pathname !== '/' && !hideGlobalFooter && !usesShellFooter;
  const useMarketingFooter = MARKETING_FOOTER_PATHS.has(pathname);
  const usePrivacyFooterLayout = pathname === '/privacy';
  const useParityFooterLayout = pathname === '/blog' || pathname === '/community' || pathname === '/enterprise' || pathname === '/pricing';
  const useProductFooterLayout = pathname === '/product' || pathname.startsWith('/product/');
  // Live's footer section uses min-height: auto and is sized by its
  // content; hardcoded values were a leftover from earlier parity work
  // and now show up as a containerMismatch (live=auto vs test=NNNpx).
  // Only set min-height on routes where the live footer also has one.
  // Live /enterprise yellow footer renders at 1161px tall (with the
  // ASCII backdrop fully expanded; under earlier image-load timing it
  // measured 1096).  Live uses min-height: auto and lets content drive
  // height — but without an explicit min-height our reduced
  // marketing-CTA block collapses to ~850px and pushes 246px of
  // cumulative Y-offset onto every element below it.  We accept the
  // small 'minHeight: live=auto test=NNNNpx' parity diff in exchange
  // for keeping the page layout in lockstep with live.  Per-route
  // values come from live's measured rendered height of the
  // `section.u-bg-primary` (yellow CTA + footer block) — most pages
  // render at 1209px once the social-icon row + footer-nav are in.
  const footerMinHeight = pathname === '/privacy' ? undefined : pathname === '/product' ? 1144 : pathname.startsWith('/product/') ? 1071 : pathname === '/enterprise' ? 1161 : 1209;

  const handleOpenGitHubModal = () => {
    setIsGitHubModalOpen(true);
  };

  const handleCloseGitHubModal = () => {
    setIsGitHubModalOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsSidebarHidden(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div data-wf-el='page-wrapper' className='relative' style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgb(249, 240, 217)', minHeight: '100vh', overflow: 'clip' }}>
      <Sidebar
        ref={sidebarRef}
        isHidden={isSidebarHidden}
        onClose={() => setIsSidebarHidden(true)}
        onClickGitHubButton={handleOpenGitHubModal}
      />
      <motion.div
        className='flex flex-col min-h-screen'
        animate={{
          paddingLeft:
            isDesktop && !isSidebarHidden ? sidebarRef.current?.clientWidth : 0,
        }}
      >
        <Header
          onClickMenuButton={() => setIsSidebarHidden(false)}
          showMenuIcon={isSidebarHidden}
          width={
            !isSidebarHidden && sidebarRef.current && isDesktop
              ? width - sidebarRef.current?.clientWidth
              : width
          }
          onClickGitHubButton={handleOpenGitHubModal}
        />
        <div className='flex-1'>
          <GitHubModalProvider openGitHubModal={handleOpenGitHubModal}>
            <Outlet />
            {showGlobalFooter &&
              (useMarketingFooter ? (
                <>
                  <MarketingFooterCta />
                  <Footer standalone compactNav minHeight={footerMinHeight} />
                </>
              ) : (
                <Footer
                  standalone
                  showSocialLinks
                  compactNav={usePrivacyFooterLayout || useParityFooterLayout || useProductFooterLayout}
                  minHeight={footerMinHeight}
                  /*
                   * On product subpages live's footer renders a
                   * page-specific CTA (e.g. "Control your agents
                   * like real infrastructure" on /product/cli)
                   * instead of the default "Building the open
                   * standard..." marketing CTA.  Look up the
                   * per-page closing copy from the same data file
                   * the page itself uses so the footer stays in
                   * sync.
                   */
                  {...productSubpageCtaProps(pathname)}
                />
              ))}
          </GitHubModalProvider>
        </div>
      </motion.div>
      
      {/* GitHub Modal */}
      <GitHubModal 
        isOpen={isGitHubModalOpen} 
        onClose={handleCloseGitHubModal} 
      />
      
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className='flex flex-col items-center gap-4 text-center py-[45px] bg-[#F1EAE0] h-screen justify-center'>
        <h1 className='heading'>404</h1>
        <p className='paragraph'>Page not found</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-4 text-center py-[45px] bg-[#F1EAE0] h-screen justify-center'>
      <h1 className='heading'>Error</h1>
      <p className='paragraph'>There was an error loading the page.</p>
    </div>
  );
}
