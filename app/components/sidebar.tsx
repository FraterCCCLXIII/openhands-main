import clsx from "clsx";
import X from "../svgs/x.svg?react";
import TripleWowYellow from "../svgs/triple-wow-yellow.svg?react";
import { NavLink } from "@remix-run/react";

const NAV_MAP = [
  { name: "Home", to: "/" },
  { name: "About Us", to: "/company" },
  { name: "Pricing", to: "/pricing" },
  { name: "Blog", to: "/blog" },
  { name: "GitHub", to: "" },
];

interface SidebarProps {
  isHidden: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isHidden, onClose }) => (
  <aside
    data-testid="sidebar"
    className={clsx(
      "bg-black fixed top-0 left-0 w-screen h-screen lg:w-[323px] items-center lg:items-start justify-center z-10",
      isHidden ? "hidden" : "flex",
    )}
    hidden={isHidden}
  >
    <button
      onClick={onClose}
      className="absolute left-7 top-7"
    >
      <X width={31} height={31} style={{ color: "#FFE165" }} />
    </button>

    <nav className="lg:mt-[122px]">
      <ul className="text-center flex flex-col gap-8">
        {NAV_MAP.map((item) => (
          <li
            key={item.name}
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
          </li>
        ))}
      </ul>
    </nav>
  </aside>
);
