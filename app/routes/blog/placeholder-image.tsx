import clsx from "clsx";
import AllHandsLogo from "~/svgs/all-hands-logo.svg?react";

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
