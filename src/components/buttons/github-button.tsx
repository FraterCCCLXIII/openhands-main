import clsx from "clsx";
import GitHubLogoBlack from "~/svgs/github-logo-black.svg?react";

interface GitHubButtonProps {
  onClick?: () => void;
}

export const GitHubButton: React.FC<GitHubButtonProps> = ({ onClick }) => {
  const commonClassName = clsx(
    "font-semibold px-4 py-2 text-sm rounded-lg border border-black",
    "flex items-center gap-2 justify-center",
  );

  const content = (
    <>
      <GitHubLogoBlack width={16} height={16} />
      <span>Start with OSS</span>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={commonClassName}>
        {content}
      </button>
    );
  }

  return (
    <a
      href="https://github.com/OpenHands/OpenHands"
      rel="noreferrer"
      target="_blank"
      className={commonClassName}
    >
      {content}
    </a>
  );
};
