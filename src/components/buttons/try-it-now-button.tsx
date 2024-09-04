import clsx from "clsx";
import { Link } from "react-router-dom";

interface TryItNowButtonProps { }

export const TryItNowButton: React.FC<TryItNowButtonProps> = () => (
  <Link
    to="/join-waitlist"
    className={clsx(
      "font-semibold px-4 py-2 text-sm rounded-lg",
      "bg-black text-white",
      "hover:bg-[#4B5563] hover:text-white transition-colors duration-50",
      "flex items-center gap-[15px]",
    )}
  >
    Try it Now
  </Link>
);
