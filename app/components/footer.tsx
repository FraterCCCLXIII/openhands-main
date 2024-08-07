import AllHandsLogo from "../svgs/all-hands-1.svg?react";
import GitHubCircleLogo from "../svgs/gh-logo.svg?react";
import FacebookLogo from "../svgs/fb-logo.svg?react";
import InstagramLogo from "../svgs/insta-logo.svg?react";
import { Link } from "@remix-run/react";

export const Footer = () => (
  <footer>
    <div className="bg-[url('/assets/white-wave.png')] h-[89px]" />

    <div className="bg-white h-[355px] lg:h-[175px] pt-8 lg:pt-0 flex justify-center">
      <div className="flex flex-col lg:flex-row items-center lg:justify-between lg:w-screen lg:max-w-[1086px] gap-8">
        <AllHandsLogo width={65} height={45} />

        <nav>
          <ul className="grid grid-cols-2 gap-8 text-center font-poppins text-sm leading-[21px] lg:flex">
            <Link to="https://github.com/OpenDevin" rel="noreferrer" target="_blank">GitHub</Link>
            <Link to="blog">Blog</Link>
            <Link to="company">About Us</Link>
            <Link to="tos">Terms of Service</Link>
            <Link to="pricing">Pricing</Link>
          </ul>
        </nav>

        <span className="flex gap-4">
          <Link to="https://www.facebook.com/" rel="noreferrer" target="_blank">
            <FacebookLogo width={24} height={24} />
          </Link>
          <Link to="https://github.com/OpenDevin" rel="noreferrer" target="_blank">
            <GitHubCircleLogo width={24} height={24} />
          </Link>
          <Link to="https://www.instagram.com/" rel="noreferrer" target="_blank">
            <InstagramLogo width={24} height={24} />
          </Link>
        </span>
      </div>
    </div>
  </footer>
);
