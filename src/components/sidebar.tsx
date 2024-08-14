import clsx from "clsx";
import X from "~/svgs/x.svg?react";
import TripleWowYellow from "~/svgs/triple-wow-yellow.svg?react";
import { motion } from "framer-motion";
import React from "react";
import { NavLink } from "react-router-dom";
import { MainButton } from "./main-button";

const NAV_MAP = [
  { name: "Home", to: "/" },
  { name: "About Us", to: "/about" },
  { name: "Blog", to: "/blog" },
  { name: "Share", to: "/share" },
];

interface SidebarProps {
  isHidden: boolean;
  onClose: () => void;
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(({ isHidden, onClose }, ref) => (
  <motion.aside
    ref={ref}
    hidden={isHidden}
    initial={{ x: "-100%" }}
    animate={{ x: isHidden ? "-100%" : 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 35 }}
    data-testid="sidebar"
    className={clsx(
      "bg-black flex fixed top-0 left-0 w-screen h-screen lg:w-[323px] items-center lg:items-start justify-center z-30",
    )}
  >
    <button
      onClick={onClose}
      className="absolute left-7 top-7"
      aria-label="Close Sidebar"
    >
      <X width={31} height={31} style={{ color: "#FFE165" }} />
    </button>

    <nav className="lg:mt-[122px]">
      <ul className="text-center flex flex-col gap-8">
        {NAV_MAP.map((item) => (
          <motion.li
            key={item.name}
            whileHover={{ scale: 1.1 }}
            className="text-white font-quincy text-[41px] leading-[42px]"
          >
            <NavLink
              to={item.to}
              className="relative"
              onClick={onClose}
            >
              {({ isActive }) => (
                <>
                  {isActive && <TripleWowYellow width={36} height={22} className="absolute -right-7 -top-2 transform rotate-[34deg]" />}
                  {item.name}
                </>
              )}
            </NavLink>
          </motion.li>
        ))}
        <li>
          <MainButton />
        </li>
      </ul>
    </nav>
  </motion.aside>
));

Sidebar.displayName = "Sidebar";
