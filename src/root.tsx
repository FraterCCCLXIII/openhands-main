import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from 'react-router';
import { Analytics } from '@vercel/analytics/react';

import type { Route } from './+types/root';
import { motion } from 'framer-motion';
import React from 'react';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { Sidebar } from './components/sidebar/sidebar';
import { useWidth } from './hooks/use-media';
import './index.css';

export const links: Route.LinksFunction = () => [
  {
    rel: 'icon',
    href: '/all-hands-logo-1.svg',
    type: 'image/svg+xml',
  },
  // Preconnect to Google Fonts
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Poppins:wght@400;600;700;800&display=swap',
  },
  // Prefetch custom fonts
  {
    rel: 'preload',
    href: '/assets/fonts/QuincyCF-Regular.woff',
    as: 'font',
    type: 'font/woff',
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
      </head>
      <body>
        {children}
        <Analytics />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const clientLoader = () => {
  // get device width on client side before hydration
  return { deviceWidth: window.innerWidth };
};

export default function App() {
  const [isSidebarHidden, setIsSidebarHidden] = React.useState(true);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const width = useWidth();
  const isDesktop = width >= 1024;

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
    <div className='relative'>
      <Sidebar
        ref={sidebarRef}
        isHidden={isSidebarHidden}
        onClose={() => setIsSidebarHidden(true)}
      />
      <motion.div
        className='mt-[133px] flex flex-col min-h-screen'
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
        />
        <div className='flex-1'>
          <Outlet />
        </div>
        <Footer />
      </motion.div>
      <ScrollRestoration />
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
