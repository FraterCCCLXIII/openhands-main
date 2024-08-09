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
    <AllHandsLogo width={227} />
  </div>
);
