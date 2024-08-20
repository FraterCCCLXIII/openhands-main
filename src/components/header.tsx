import React from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import MenuIcon from "~/svgs/menu.svg?react";
import { Link } from "react-router-dom";
import { AnimatedHeaderLogo } from "./animated-header-logo";
import { Button } from "./button";

interface HeaderProps {
  onClickMenuButton: () => void;
  width?: number;
}

export const Header: React.FC<HeaderProps> = ({ width, onClickMenuButton }) => {
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
        className="absolute left-[26px]"
      >
        <MenuIcon width={38} height={38} />
      </button>

      <Link to="/" aria-label="Go to Home">
        <AnimatedHeaderLogo renderText={textIsVisible} />
      </Link>


      <Button
        text="Get it on GitHub"
        className="hidden lg:block absolute right-[26px] lg:text-lg"
        to="https://github.com/OpenDevin"
        external
      />
    </motion.header>
  );
};
