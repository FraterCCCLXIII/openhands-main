import React from "react";
import HamburgerMenuIcon from "../svgs/menu-icon.svg?react";
import clsx from "clsx";
import { NavLink, Link } from "@remix-run/react";
import { AnimatedHeaderLogo } from "./animated-header-logo";

const NAV_MAP = [
  { name: "Research", to: "/research" },
  { name: "Products", to: "/pricing" },
  { name: "Company", to: "/company" },
  { name: "Blog", to: "/blog" },
  { name: "Community", to: "/community" },
]

interface HeaderProps {
  /* isRoot is a boolean that determines if the header is the root header */
  isRoot: boolean;
  onClickMenuButton: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isRoot, onClickMenuButton }) => (
  <header
    className={clsx(
      "h-[83px] flex items-center relative w-screen px-[26px]",
      !isRoot ? "justify-between" : "justify-center"
    )}
  >
    {isRoot && (
      <button
        aria-label="Open Menu"
        onClick={onClickMenuButton}
        className="absolute left-[26px]"
      >
        <HamburgerMenuIcon width={24} height={24} />
      </button>
    )}

    <Link
      aria-label="All Hands Home"
      to="/"
    >
      <AnimatedHeaderLogo />
    </Link>

    {!isRoot && (
      <nav>
        <ul className="font-poppins text-sm leading-[21px] font-normal flex gap-8">
          {NAV_MAP.map(({ name, to }) => (
            <li key={name}>
              <NavLink
                to={to}
                className={({ isActive }) => isActive ? "underline underline-offset-2" : ""}
              >
                {name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    )}

    <Link
      rel="noreferrer"
      target="_blank"
      to="https://github.com/OpenDevin"
      className={
        clsx(
          "hidden lg:block px-4 py-2 rounded-lg bg-black",
          isRoot && "absolute right-[26px]"
        )
      }
    >
      <span className="text-white font-bold font-poppins text-sm leading-5">View GitHub</span>
    </Link>
  </header >
);
