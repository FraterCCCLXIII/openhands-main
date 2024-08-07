import { Link } from "@remix-run/react";
import clsx from "clsx";

interface GitHubButtonProps {
  position?: "start";
}

export const GitHubButton: React.FC<GitHubButtonProps> = ({ position }) => (
  <Link
    to="https://github.com/OpenDevin"
    rel="noreferrer"
    target="_blank"
    className={clsx("bg-black px-4 py-[11px] rounded-lg", position && "self-start")}>
    <span className="text-white text-[19px] leading-[27px] font-bold">Join our GitHub</span>
  </Link>
);
