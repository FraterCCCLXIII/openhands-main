import clsx from "clsx";
import GitHubLogoBlack from "~/svgs/github-logo-black.svg?react";

interface GitHubButtonProps { }

export const GitHubButton: React.FC<GitHubButtonProps> = () => (
  <a
    href="https://github.com/All-Hands-AI/OpenHands"
    rel="noreferrer"
    target="_blank"
    className={clsx(
      "font-semibold px-4 py-2 text-sm rounded-lg border border-black",
      "flex items-center gap-2",
    )}
  >
    <GitHubLogoBlack width={16} height={16} />
    <span>Get it on GitHub</span>
  </a>
);
