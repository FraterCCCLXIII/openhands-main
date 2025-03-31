import clsx from "clsx";
import { Link } from "react-router-dom";

interface TryItLiveButtonProps { }

export const TryItLiveButton: React.FC<TryItLiveButtonProps> = () => (
  <Link
    to="https://app.all-hands.dev"
    target="_blank"
    rel="noopener noreferrer"
    className={clsx(
      "font-semibold px-4 py-2 text-sm rounded-lg",
      "bg-black text-white",
      "hover:bg-[#4B5563] hover:text-white transition-colors duration-50",
      "flex items-center gap-[15px]",
    )}
  >
    Try it live
  </Link>
);
