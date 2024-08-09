import clsx from "clsx";
import { Link } from "react-router-dom";

interface GitHubButtonProps {
  position?: "start";
}

export const GitHubButton: React.FC<GitHubButtonProps> = ({ position }) => (
  <Link
    to="https://github.com/OpenDevin"
    rel="noreferrer"
    target="_blank"
    className={clsx(
      "bg-black px-4 py-[11px] rounded-lg",
      "text-white text-[19px] leading-[27px] font-bold",
      position && "self-start",
    )}>
    Join our GitHub
  </Link>
);
