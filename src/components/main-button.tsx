import React from "react";
import { Button } from "./button";
import GitHubLogoBlack from "~/svgs/github-logo-black.svg?react";
import GitHubLogo from "~/svgs/github-logo.svg?react";

interface MainButtonProps {
  onClick?: () => void;
}

export const MainButton: React.FC<MainButtonProps> = ({ onClick }) => {
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
      text="Start with OSS"
      to={onClick ? undefined : "https://github.com/All-Hands-AI/OpenHands"}
      onClick={onClick}
      external={!onClick}
    />
  );
};
