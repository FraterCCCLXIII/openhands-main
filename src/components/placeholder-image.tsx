import clsx from "clsx";
import AllHandsLogo from "~/svgs/brand/all-hands-logo-1.svg?react";
import RobotDrivingCar from "~/svgs/img-placeholder.svg?react";

interface PlaceholderImageProps {
  variant?: "robot" | "all-hands";
  className?: React.HTMLAttributes<HTMLDivElement>["className"];
}

export const PlaceholderImage: React.FC<PlaceholderImageProps> = ({ variant = "all-hands", className }) => (
  <div
    style={{
      background: clsx(
        variant === "all-hands" && "radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, #FFF8DA 50%, #FFE165 100%)",
        variant === "robot" && "radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, #ACC8FF 100%)",
      ),
    }}
    className={clsx(
      "rounded-[10px] flex items-center justify-center",
      className,
    )}
  >
    {variant === "robot" && <RobotDrivingCar className="w-[150px] h-[104px] lg:w-[227px] lg:h-[157px]" />}
    {variant === "all-hands" && <AllHandsLogo className="w-[150px] h-[104px] lg:w-[227px] lg:h-[157px]" />}
  </div>
);
