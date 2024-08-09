import { Link } from "react-router-dom";
import AllHandsLogo from "~/svgs/brand/all-hands-logo-1.svg?react";
import GitHubCircleLogo from "~/svgs/gh-logo.svg?react";

export const Footer = () => (
  <footer>
    <div className="bg-[url('/assets/white-wave.png')] h-[89px]" />

    <div className="bg-white h-[355px] lg:h-[175px] pt-8 lg:pt-0 flex justify-center">
      <div className="flex flex-col lg:flex-row items-center lg:justify-between lg:w-screen lg:max-w-[1086px] gap-8">
        <AllHandsLogo width={65} height={45} />

        <nav>
          <ul className="grid grid-cols-2 gap-8 text-center font-poppins text-sm leading-[21px] lg:flex">
            <li>
              <Link to="https://github.com/OpenDevin" rel="noreferrer" target="_blank">GitHub</Link>
            </li>
            <li>
              <Link to="blog">Blog</Link>
            </li>
            <li>
              <Link to="about">About Us</Link>
            </li>
            <li>
              <Link to="tos">Terms of Service</Link>
            </li>
          </ul>
        </nav>

        <span className="flex gap-4">
          <Link aria-label="OpenDevin GitHub" to="https://github.com/OpenDevin" rel="noreferrer" target="_blank">
            <GitHubCircleLogo width={24} height={24} />
          </Link>
        </span>
      </div>
    </div>
  </footer>
);
