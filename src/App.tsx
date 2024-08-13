import React from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { Sidebar } from "./components/sidebar";
import { motion } from "framer-motion";
import { useWidth } from "./hooks/use-media";

const App = () => {
  const [isSidebarHidden, setIsSidebarHidden] = React.useState(true);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const width = useWidth();

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
          paddingLeft: width >= 1024 && !isSidebarHidden ? sidebarRef.current?.clientWidth : 0,
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
