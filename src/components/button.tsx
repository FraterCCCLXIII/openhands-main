import clsx from 'clsx';
import { Link } from 'react-router';

// TODO: Separate the button from the Link

interface ButtonProps {
  text: string;
  // If `to` is provided, it will be used as the Link `to` prop
  to?: string;
  // If `external` is true, it will be used as the anchor tag (recommended for external links)
  external?: boolean;
  icon?: React.ReactNode;
  variant?: 'small' | 'medium' | 'large';
  style?: 'primary' | 'secondary';
  className?: string;
  // If `onClick` is provided, it will render as a button instead of a link
  onClick?: () => void;

  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  text,
  to,
  external,
  icon,
  variant = 'small',
  style = 'primary',
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const commonClassName = clsx(
    style === 'primary' ? 'bg-black text-white' : 'bg-transparent text-black',
    'font-semibold px-4 rounded-lg hover:bg-[#4B5563] hover:text-white transition-colors duration-50',
    icon && 'flex items-center gap-[15px]',
    variant === 'small' ? 'py-2 text-sm' : 'py-[11px]',
    variant !== 'small' && 'text-[19px] leading-[27px]', // medium and large
    variant === 'large' && 'px-[40px] py-4 min-w-[250px]',
    variant === 'medium' && 'px-6 min-w-[220px]',
    className
  );

  const content = (
    <>
      {icon}
      {text}
    </>
  );

  if (onClick) {
    return (
      <button
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        className={commonClassName}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      to={to!}
      rel={external ? 'noreferrer' : undefined}
      target={external ? '_blank' : undefined}
      className={commonClassName}
    >
      {content}
    </Link>
  );
};
