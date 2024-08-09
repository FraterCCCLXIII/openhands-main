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
        handle: {
          meta: {
            title: "All Hands",
            description: "Welcome to the All Hands website!",
          },
        },
      },
      {
        path: "/about",
        element: <About />,
        handle: {
          meta: {
            title: "All Hands - Company",
            description: "Discover the talented team behind OpenDevin and how we leverage the power of collaboration to innovate in software development.",
          },
        },
      },
      {
        path: "/blog",
        element: <Blog />,
        loader: blogLoader,
        handle: {
          meta: {
            title: "All Hands Blog - Insights and Innovations",
            description: "Read the latest insights and innovations from All Hands.",
          },
        },
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
        handle: {
          meta: {
            title: "All Hands - Terms of Service",
            description: "All Hands terms of service agreement.",
          },
        },
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
