import clsx from "clsx";
import AllHandsLogo from "~/svgs/brand/all-hands-logo-1.svg?react";

interface PlaceholderImageProps {
  className?: React.HTMLAttributes<HTMLDivElement>["className"];
}

export const PlaceholderImage: React.FC<PlaceholderImageProps> = ({ className }) => (
  <div
    className={clsx(
      "rounded-[10px] bg-[#ACC8FF] flex items-center justify-center",
      className,
    )}
  >
    <AllHandsLogo className="w-[150px] h-[104px] lg:w-[227px] lg:h-[157px]" />
  </div>
);
