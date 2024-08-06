import AllHandsLogo from "../../svgs/all-hands-1.svg?react";
import GitHubCircleLogo from "../../svgs/gh-logo.svg?react";
import FacebookLogo from "../../svgs/fb-logo.svg?react";
import InstagramLogo from "../../svgs/insta-logo.svg?react";

export const Footer = () => (
  <footer>
    <div className="bg-[url('/assets/white-wave.png')] h-[89px]" />

    <div className="bg-white h-[355px] lg:h-[175px] pt-8 lg:pt-0 flex justify-center">
      <div className="flex flex-col lg:flex-row items-center lg:justify-between lg:w-screen lg:max-w-[1086px] gap-8">
        <AllHandsLogo width={65} height={45} />

        <nav>
          <ul className="grid grid-cols-2 gap-8 text-center font-poppins text-sm leading-[21px] lg:flex">
            <li>GitHub</li>
            <li>Blog</li>
            <li>About Us</li>
            <li>Terms of Service</li>
            <li>Pricing</li>
          </ul>
        </nav>

        <span className="flex gap-4">
          <FacebookLogo width={24} height={24} />
          <GitHubCircleLogo width={24} height={24} />
          <InstagramLogo width={24} height={24} />
        </span>
      </div>
    </div>
  </footer>
);
