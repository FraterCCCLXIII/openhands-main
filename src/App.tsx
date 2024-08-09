import React from "react";
import { Outlet, ScrollRestoration, useMatches } from "react-router-dom";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { Sidebar } from "./components/sidebar";
import { Helmet } from "react-helmet-async";

const App = () => {
  const matches = useMatches();
  const match = matches.reverse().find(match => match.handle?.meta);

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
    <>
      {match && (
        <Helmet>
          <title>{match?.handle?.meta?.title || "Untitled"}</title>
          <meta name="description" content={match?.handle?.meta?.description || ""} />
        </Helmet>
      )}
      <div className="bg-[#F1EAE0]">
        <Header
          onClickMenuButton={() => setIsSidebarHidden(false)}
        />
        <Sidebar
          ref={sidebarRef}
          isHidden={isSidebarHidden}
          onClose={() => setIsSidebarHidden(true)}
        />
        <Outlet />
        <Footer />
        <ScrollRestoration />
      </div>
    </>
  );
};

export default App;
