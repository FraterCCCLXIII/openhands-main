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
  const isDesktop = width >= 1024;

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
    <div className="bg-[#F1EAE0] relative">
      <Sidebar
        ref={sidebarRef}
        isHidden={isSidebarHidden}
        onClose={() => setIsSidebarHidden(true)}
      />
      <motion.div
        className="mt-[83px]"
        animate={{
          paddingLeft: isDesktop && !isSidebarHidden ? sidebarRef.current?.clientWidth : 0,
        }}
      >
        <Header
          onClickMenuButton={() => setIsSidebarHidden(false)}
          width={(!isSidebarHidden && sidebarRef.current && isDesktop) ? width - sidebarRef.current?.clientWidth : width}
        />
        <Outlet />
        <Footer />
      </motion.div>
      <ScrollRestoration />
    </div>
  );
};

export default App;
