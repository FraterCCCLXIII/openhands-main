import clsx from "clsx";

interface RegularButtonProps {
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  children: string;
  className?: React.HTMLAttributes<HTMLButtonElement>["className"];
}

export const RegularButton: React.FC<RegularButtonProps> = ({ onClick, type = "button", disabled = false, children, className }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      "bg-black text-white py-2 text-sm",
      "font-semibold px-4 rounded-lg hover:bg-[#4B5563] hover:text-white transition-colors duration-50",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:transition-none",
      className,
    )}
  >
    {children}
  </button>
);
