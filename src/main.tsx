import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home, { loader as homeLoader } from './routes/home';
import About from './routes/about';
import Blog, { loader as blogLoader } from './routes/blog';
import BlogDetails, { loader as blogDetailsLoaders, ErrorBoundary as BlogDetailsErrorBoundary } from './routes/blog.$slug';
import { HelmetProvider } from 'react-helmet-async';
import Share, { loader as shareLoader } from './routes/share';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />,
        loader: homeLoader,
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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <HelmetProvider>
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </HelmetProvider>,
);
