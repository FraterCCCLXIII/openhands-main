import AllHandsLogo from "../../../assets/all-hands-1.svg?react";
import GitHubCircleLogo from "../../../assets/gh-logo.svg?react";
import FacebookLogo from "../../../assets/fb-logo.svg?react";
import InstagramLogo from "../../../assets/insta-logo.svg?react";

export const Footer = () => (
  <footer>
    <div className="bg-[url('../../assets/white-wave.png')] h-[89px]" />

    <div className="bg-white pb-[69px] flex justify-center items-center">
      <div className="flex flex-col lg:flex-row items-center lg:justify-between lg:w-screen lg:max-w-[1086px] gap-8 pt-8">
        <AllHandsLogo width={39} height={26} />

        <nav>
          <ul className="grid grid-cols-2 gap-8 text-center lg:flex">
            <ul>GitHub</ul>
            <ul>Blog</ul>
            <ul>About Us</ul>
            <ul>Terms of Service</ul>
            <ul>Pricing</ul>
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
