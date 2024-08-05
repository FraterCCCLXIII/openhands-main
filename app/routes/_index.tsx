import type { MetaFunction } from "@remix-run/node";
import HamburgerMenuIcon from "../../assets/menu-icon.svg?react";
import AllHandsLogo from "../../assets/all-hands-1.svg?react";

export const meta: MetaFunction = () => {
  return [
    { title: "All Hands" },
    { name: "description", content: "Welcome to the All Hands website!" },
  ];
};

const AllHands = () => <span className="text-xl">All Hands</span>;

export default function Index() {
  return (
    <div className="bg-[#F1EAE0] h-screen">
      <header className="h-[83px] flex items-center justify-center relative">
        <div className="absolute left-[26px]">
          <HamburgerMenuIcon width={24} height={24} />
        </div>
        <div className="flex gap-2">
          <AllHandsLogo width={39} height={26} />
          <AllHands />
        </div>
      </header>
    </div>
  );
}
