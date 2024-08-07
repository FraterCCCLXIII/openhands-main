import React from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "@remix-run/react";
import "./tailwind.css";

import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { Sidebar } from "./components/sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarHidden, setIsSidebarHidden] = React.useState(true);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="bg-[#F1EAE0]">
          <Header
            isRoot={location.pathname === "/"}
            onClickMenuButton={() => setIsSidebarHidden(false)}
          />
          <Sidebar
            isHidden={isSidebarHidden}
            onClose={() => setIsSidebarHidden(true)}
          />
          {children}
          <Footer />
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
