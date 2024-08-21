import React from "react";
import { Button } from "./button";
import GitHubLogoBlack from "~/svgs/github-logo-black.svg?react";
import GitHubLogo from "~/svgs/github-logo.svg?react";

export const MainButton = () => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <Button
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style="secondary"
      variant="large"
      icon={isHovered ? <GitHubLogo width={23} height={23} /> : <GitHubLogoBlack width={23} height={23} />}
      text="Get it on GitHub"
      to="https://github.com/All-Hands-AI/OpenHands"
      external
    />
  );
};
