import React from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { Sidebar } from "./components/sidebar";
import { motion } from "framer-motion";

const App = () => {
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
    <div className="bg-[#F1EAE0]">
      <Sidebar
        ref={sidebarRef}
        isHidden={isSidebarHidden}
        onClose={() => setIsSidebarHidden(true)}
      />
      <Header
        onClickMenuButton={() => setIsSidebarHidden(false)}
      />
      <motion.div
        animate={{
          paddingLeft: !isSidebarHidden ? sidebarRef.current?.clientWidth : 0,
        }}
      >
        <Outlet />
        <Footer />
      </motion.div>
      <ScrollRestoration />
    </div>
  );
};

export default App;
