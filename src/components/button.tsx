import clsx from "clsx";
import { Link } from "react-router-dom";

interface ButtonProps {
  text: string;
  // If `to` is provided, it will be used as the Link `to` prop
  to: string;
  // If `external` is true, it will be used as the anchor tag (recommended for external links)
  external?: boolean;
  icon?: React.ReactNode;
  variant?: "small" | "medium" | "large";
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  text,
  to,
  external,
  icon,
  variant = "small",
  className,
}) => (
  <Link
    to={to}
    rel={external ? "noreferrer" : undefined}
    target={external ? "_blank" : undefined}
    className={clsx(
      "bg-black px-4 rounded-lg hover:bg-[#4B5563]",
      "text-white font-semibold",
      icon && "flex items-center gap-[15px]",
      variant === "small" ? "py-2 text-sm" : "py-[11px]",
      variant !== "small" && "text-[19px] leading-[27px]", // medium and large
      variant === "large" && "px-[30px] py-4",
      className,
    )}
  >
    {icon}
    {text}
  </Link>
);
