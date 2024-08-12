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
    <div className="bg-[#F1EAE0] overflow-hidden">
      <Sidebar
        ref={sidebarRef}
        isHidden={isSidebarHidden}
        onClose={() => setIsSidebarHidden(true)}
      />
      <motion.div
        animate={{
          x: !isSidebarHidden ? sidebarRef.current?.clientWidth : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }} // this is the same transition properties as the sidebar for consistency
      >
        <Header
          onClickMenuButton={() => setIsSidebarHidden(false)}
        />
        <Outlet />
        <Footer />
      </motion.div>
      <ScrollRestoration />
    </div>
  );
};

export default App;
