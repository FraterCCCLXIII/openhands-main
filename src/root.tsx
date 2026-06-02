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
import { Sidebar } from './components/sidebar/sidebar';
import { GitHubModal } from './components/github-modal';
import { GitHubModalProvider } from './contexts/github-modal-context';
import { useWidth } from './hooks/use-media';
import { normalizePathname } from './utils/normalize-pathname';
import { getRouteLayoutConfig, toFooterProps } from './constants/route-layout';
import './index.css';
import { PHProvider } from './provider';
import { PixelBlastProvider } from './contexts/pixel-blast-context';
import { PixelBlastRenderer } from './components/pixel-blast-renderer';
import { HomeVariantProvider } from './contexts/home-variant-context';

export const links: Route.LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
  },
  // Preload the exact live Webflow brand font used above the fold.
  {
    rel: 'preload',
    href: '/assets/fonts/Sohne-Kraftig.otf',
    as: 'font',
    type: 'font/otf',
    crossOrigin: 'anonymous',
  },
  // Preconnect to GitHub avatars
  {
    rel: 'preconnect',
    href: 'https://avatars.githubusercontent.com',
    crossOrigin: 'anonymous',
  },
];

function HubSpotTrackingScript() {
  React.useEffect(() => {
    if (document.getElementById('hs-script-loader')) return;

    const script = document.createElement('script');
    script.id = 'hs-script-loader';
    script.src = 'https://js.hs-scripts.com/50790961.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  return null;
}

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
          <HubSpotTrackingScript />
          <Analytics />
          <ScrollRestoration />
          <Scripts />
        </PHProvider>
      </body>
    </html>
  );
}

export default function App() {
  const [isSidebarHidden, setIsSidebarHidden] = React.useState(true);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const location = useLocation();
  const matches = useMatches();
  const pathname = normalizePathname(location.pathname);
  const width = useWidth();
  const isCompactNav = width <= 1360;
  const routeLayout = getRouteLayoutConfig(pathname, width);
  const hideGlobalFooter = matches.some(
    (match) => (match.handle as { hideGlobalFooter?: boolean } | undefined)?.hideGlobalFooter,
  );
  const showGlobalFooter = routeLayout.footer.mode === 'global' && !hideGlobalFooter;
  const pageWrapperHeight = routeLayout.pageWrapper?.height;

  const handleOpenGitHubModal = () => {
    setIsGitHubModalOpen(true);
  };

  const handleCloseGitHubModal = () => {
    setIsGitHubModalOpen(false);
  };

  React.useEffect(() => {
    setIsSidebarHidden(true);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!isCompactNav) {
      setIsSidebarHidden(true);
    }
  }, [isCompactNav]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('.mobile-menu-button')) {
        return;
      }

      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(target as Node)
      ) {
        setIsSidebarHidden(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const pageWrapperClassName = ['relative', routeLayout.pageWrapper?.className].filter(Boolean).join(' ');

  return (
    <PixelBlastProvider>
      <HomeVariantProvider>
      <div data-wf-el='page-wrapper' className={pageWrapperClassName} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgb(249, 240, 217)', minHeight: '100vh', overflow: 'clip', height: pageWrapperHeight }}>

      <Sidebar
        ref={sidebarRef}
        isHidden={isSidebarHidden}
        onClose={() => setIsSidebarHidden(true)}
        onClickGitHubButton={handleOpenGitHubModal}
      />
      <motion.div
        className='flex flex-col min-h-screen'
        animate={{ paddingLeft: 0 }}
      >
        <Header
          onClickMenuButton={() => setIsSidebarHidden(false)}
          onClickCloseMenuButton={() => setIsSidebarHidden(true)}
          showMenuIcon={isSidebarHidden}
          width={width}
          onClickGitHubButton={handleOpenGitHubModal}
        />
        <div className='flex-1'>
          <GitHubModalProvider openGitHubModal={handleOpenGitHubModal}>
            <Outlet />
            {showGlobalFooter ? <Footer {...toFooterProps(routeLayout.footer)} /> : null}
          </GitHubModalProvider>
          {routeLayout.afterGlobalFooterSpacerHeight ? <div aria-hidden='true' style={{ height: routeLayout.afterGlobalFooterSpacerHeight }} /> : null}
        </div>
      </motion.div>
      
      {/* GitHub Modal */}
      <GitHubModal 
        isOpen={isGitHubModalOpen} 
        onClose={handleCloseGitHubModal} 
      />

      <PixelBlastRenderer />
      
    </div>
      </HomeVariantProvider>
    </PixelBlastProvider>
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
