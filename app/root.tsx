import React from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import "./tailwind.css";

import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { Sidebar } from "./components/sidebar";
import { LinksFunction } from "@remix-run/node";

export const links: LinksFunction = () => ([
  { rel: "stylesheet", href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Poppins:wght@400;600;700;800&display=swap' },
]);

export function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarHidden, setIsSidebarHidden] = React.useState(true);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarHidden(true);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, []);

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
          <Header onClickMenuButton={() => setIsSidebarHidden(false)} />
          <Sidebar
            ref={sidebarRef}
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
