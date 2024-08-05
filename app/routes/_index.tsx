import type { MetaFunction } from "@remix-run/node";
import HamburgerMenuIcon from "../../assets/menu-icon.svg?react";
import AllHandsLogo from "../../assets/all-hands-1.svg?react";
import GitHubLogo from "../../assets/github.svg?react";
import TripleWow from "../../assets/triple-wow.svg?react";

export const meta: MetaFunction = () => {
  return [
    { title: "All Hands" },
    { name: "description", content: "Welcome to the All Hands website!" },
  ];
};

const AllHands = () => <span className="text-xl">All Hands</span>;

export default function Index() {
  return (
    <div className="bg-[#F1EAE0]">
      <header className="h-[83px] flex items-center justify-center relative">
        <div className="absolute left-[26px]">
          <HamburgerMenuIcon width={24} height={24} />
        </div>
        <div className="flex gap-2">
          <AllHandsLogo width={39} height={26} />
          <AllHands />
        </div>
      </header>

      <main>
        <div className="flex flex-col items-center gap-4 mt-[50px] mb-[79px]">
          <h1 className="text-[58px] leading-[58px] font-normal text-center">Open Source Agents for Developers</h1>

          <button className="bg-black px-[30px] h-[58px] rounded-lg flex items-center gap-[15px]">
            <GitHubLogo width={23} height={23} />
            <span className="text-white text-[19px] leading-[27px] font-bold">Get it on Github</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-8">
          <TripleWow width={53} height={33} />
          <img alt="product" width={378} height={212} className="bg-[#D4CABD] rounded-[10px]" />
          <p className="text-lg leading-[25px] text-center w-[352px] text-[#292A36]">Development agents use AI to tackle the toil in your backlog, so you can focus on what matters: hard problems, creative challenges, and over-engineering your dotfiles</p>
        </div>
      </main>
    </div>
  );
}
