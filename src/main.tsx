import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { createBrowserRouter, isRouteErrorResponse, RouterProvider, useRouteError } from 'react-router-dom';
import Home from './routes/home';
import About from './routes/about';
import Blog, { loader as blogLoader, action as blogAction } from './routes/blog';
import BlogDetails, { loader as blogDetailsLoaders, ErrorBoundary as BlogDetailsErrorBoundary } from './routes/blog.$slug';
import { HelmetProvider } from 'react-helmet-async';
import Share, { loader as shareLoader } from './routes/share';
import JoinWaitlist, { action as joinWaitlistAction } from './routes/join-waitlist';
import { Analytics } from "@vercel/analytics/react";
import TOS from './routes/tos';
import PrivacyPolicy from './routes/privacy-policy';

const AppErrorBoundary = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-[45px] bg-[#F1EAE0] h-screen justify-center">
        <h1 className="heading">404</h1>
        <p className="paragraph">Page not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center py-[45px] bg-[#F1EAE0] h-screen justify-center">
      <h1 className="heading">Error</h1>
      <p className="paragraph">There was an error loading the page.</p>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <AppErrorBoundary />,
    children: [
      {
        path: "/",
        element: <Home />,
        loader: () => ({}),
      },
      {
        path: "/about",
        element: <About />,
        loader: () => ({}),
      },
      {
        path: "/blog",
        element: <Blog />,
        loader: blogLoader,
        action: blogAction,
      },
      {
        id: "blog-details",
        path: "/blog/:slug",
        element: <BlogDetails />,
        errorElement: <BlogDetailsErrorBoundary />,
        loader: blogDetailsLoaders,
      },
      {
        path: "/share",
        element: <Share />,
        loader: shareLoader,
      },
      {
        path: "/join-waitlist",
        element: <JoinWaitlist />,
        action: joinWaitlistAction,
        loader: () => ({}),
      },
      {
        path: "/tos",
        element: <TOS />,
        loader: () => ({}),
      },
      {
        path: "/privacy",
        element: <PrivacyPolicy />,
        loader: () => ({}),
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <HelmetProvider>
    <React.StrictMode>
      <RouterProvider router={router} />
      <Analytics />
    </React.StrictMode>
  </HelmetProvider>,
);
