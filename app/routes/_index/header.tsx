import HamburgerMenuIcon from "../../../assets/menu-icon.svg?react";
import AllHandsText from "../../../assets/all-hands-text.svg?react";
import AllHandsLogo from "../../../assets/all-hands-1.svg?react";

export const Header = () => (
  <header className="h-[83px] flex items-center justify-center relative">
    <div className="absolute left-[26px]">
      <HamburgerMenuIcon width={24} height={24} />
    </div>

    <div className="flex gap-2 items-center">
      <AllHandsLogo width={39} height={26} />
      <AllHandsText width={126} height={21} />
    </div>

    <button className="hidden lg:block px-4 py-2 rounded-lg bg-black absolute right-[26px]">
      <span className="text-white font-bold font-poppins text-sm leading-5">View GitHub</span>
    </button>
  </header>
);
