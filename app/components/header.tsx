import HamburgerMenuIcon from "../svgs/menu-icon.svg?react";
import AllHandsText from "../svgs/all-hands-text.svg?react";
import AllHandsLogo from "../svgs/all-hands-1.svg?react";
import clsx from "clsx";
import { NavLink } from "@remix-run/react";
import { Link } from "react-router-dom";

const NavMap = [
  { name: "Research", to: "/research" },
  { name: "Products", to: "/products" },
  { name: "Company", to: "/company" },
  { name: "Community", to: "/community" },
]

interface HeaderProps {
  /* isRoot is a boolean that determines if the header is the root header */
  isRoot?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isRoot }) => (
  <header className={clsx(
    "h-[83px] flex items-center relative w-screen px-[26px]",
    !isRoot ? "justify-between" : "justify-center"
  )}>
    {isRoot && (
      <div className="absolute left-[26px]">
        <HamburgerMenuIcon width={24} height={24} />
      </div>
    )}

    <Link to="/" className="flex gap-2 items-center">
      <AllHandsLogo width={39} height={26} />
      <AllHandsText width={126} height={21} />
    </Link>

    {!isRoot && (
      <nav>
        <ul className="font-poppins text-sm leading-[21px] font-normal flex gap-8">
          {NavMap.map(({ name, to }) => (
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

    <button className={clsx(
      "hidden lg:block px-4 py-2 rounded-lg bg-black",
      isRoot && "absolute right-[26px]"
    )}>
      <span className="text-white font-bold font-poppins text-sm leading-5">View GitHub</span>
    </button>
  </header >
);
