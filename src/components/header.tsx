import React from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import MenuIcon from "~/svgs/menu.svg?react";
import { Link } from "react-router-dom";
import { AnimatedHeaderLogo } from "./animated-header-logo";
import { Button } from "./button";

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


        <Button
          text="View GitHub"
          className="hidden lg:block absolute right-[26px]"
          to="https://github.com/OpenDevin"
          external
        />
      </div>
    </header >
  );
};
