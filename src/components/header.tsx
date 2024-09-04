import React from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import MenuIcon from "~/svgs/menu.svg?react";
import { Link } from "react-router-dom";
import { AnimatedHeaderLogo } from "./animated-header-logo";
import clsx from "clsx";
import { GitHubButton } from "./buttons/github-button";
import { SaveYourSpotButton } from "./buttons/try-it-now-button";

interface HeaderProps {
  onClickMenuButton: () => void;
  showMenuIcon?: boolean;
  width?: number;
}

export const Header: React.FC<HeaderProps> = ({ width, showMenuIcon, onClickMenuButton }) => {
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
    <motion.header
      initial={false}
      animate={{ width }}
      transition={{ type: "spring", stiffness: 300, damping: 35 }} // same as sidebar
      className="h-[83px] flex items-center bg-[#F1EAE0] fixed top-0 right-0 justify-center z-20"
    >
      <button
        aria-label="Open Menu"
        onClick={onClickMenuButton}
        className={clsx("absolute left-[26px]", showMenuIcon ? "block" : "hidden")}
      >
        <MenuIcon width={38} height={38} />
      </button>

      <Link to="/" aria-label="Go to Home">
        <AnimatedHeaderLogo renderText={textIsVisible} />
      </Link>


      <div className="hidden lg:flex gap-[15px] absolute right-[26px]">
        <SaveYourSpotButton />
        <GitHubButton />
      </div>
    </motion.header>
  );
};
