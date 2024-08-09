import React from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { MenuIcon } from "~/svgs/menu-icon";
import { Link } from "react-router-dom";
import { AnimatedHeaderLogo } from "./animated-header-logo";

interface HeaderProps {
  onClickMenuButton: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onClickMenuButton }) => {
  const { scrollY } = useScroll();
  const [textIsVisible, setTextIsVisible] = React.useState(true);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 0) {
      setTextIsVisible(false);
    } else {
      setTextIsVisible(true);
    }
  });

  return (
    <header className="h-[83px] w-screen">
      <div className="h-[83px] flex items-center bg-[#F1EAE0] fixed w-full justify-center z-20">
        <button
          aria-label="Open Menu"
          onClick={onClickMenuButton}
          className="absolute left-[26px]"
        >
          <MenuIcon width={24} height={24} />
        </button>

        <Link to="/">
          <AnimatedHeaderLogo renderText={textIsVisible} />
        </Link>


        <Link
          rel="noreferrer"
          target="_blank"
          to="https://github.com/OpenDevin"
          className="hidden lg:block px-4 py-2 rounded-lg bg-black absolute right-[26px]"
        >
          <span className="text-white font-bold font-poppins text-sm leading-5">View GitHub</span>
        </Link>
      </div>
    </header >
  )
};
