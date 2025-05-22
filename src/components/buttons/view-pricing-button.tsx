import clsx from "clsx";
import { Link } from "react-router-dom";

interface ViewPricingButtonProps { }

export const ViewPricingButton: React.FC<ViewPricingButtonProps> = () => (
  <Link
    to="/pricing"
    className={clsx(
      "font-semibold px-4 py-2 text-sm rounded-lg",
      "bg-white text-black border border-black",
      "hover:bg-gray-100 transition-colors duration-50",
      "flex items-center gap-[15px]",
    )}
  >
    View pricing
  </Link>
);