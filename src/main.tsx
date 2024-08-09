import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home, { loader as homeLoader } from './routes/home';
import About from './routes/about';
import TermsOfService from './routes/tos';
import Blog, { loader as blogLoader } from './routes/blog';
import BlogDetails, { loader as blogDetailsLoaders, ErrorBoundary as BlogDetailsErrorBoundary } from './routes/blog.$id';
import { HelmetProvider } from 'react-helmet-async';

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
      },
      {
        path: "/blog",
        element: <Blog />,
        loader: blogLoader,
      },
      {
        id: "blog-details",
        path: "/blog/:id",
        element: <BlogDetails />,
        errorElement: <BlogDetailsErrorBoundary />,
        loader: blogDetailsLoaders,
      },
      {
        path: "tos",
        element: <TermsOfService />,
      }
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
