import AllHandsLogo from "../../../assets/all-hands-1.svg?react";
import GitHubCircleLogo from "../../../assets/gh-logo.svg?react";
import FacebookLogo from "../../../assets/fb-logo.svg?react";
import InstagramLogo from "../../../assets/insta-logo.svg?react";

export const Footer = () => (
  <footer>
    <img src="../../assets/white-wave.png" alt="" className="-mb-1" />

    <div className="bg-white flex flex-col items-center gap-8 pt-8 pb-[69px]">
      <AllHandsLogo width={39} height={26} />

      <div className="grid grid-cols-2 gap-8 text-center">
        <span>GitHub</span>
        <span>Blog</span>
        <span>About Us</span>
        <span>Terms of Service</span>
        <span>Pricing</span>
      </div>

      <span className="flex gap-4">
        <FacebookLogo width={24} height={24} />
        <GitHubCircleLogo width={24} height={24} />
        <InstagramLogo width={24} height={24} />
      </span>
    </div>
  </footer>
);
