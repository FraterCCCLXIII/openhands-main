import clsx from 'clsx';

interface OverlayLinkButtonProps {
  href: string;
  label: string;
  srLabel?: string;
  variant?: 'primary' | 'outline' | 'lightbrown';
  className?: string;
  textClassName?: string;
  fullWidth?: boolean;
}

const VARIANT_CLASSNAMES: Record<NonNullable<OverlayLinkButtonProps['variant']>, string> = {
  primary: 'btn btn-primary',
  outline: 'btn btn-outline',
  lightbrown: 'btn border border-transparent bg-[#6f5a4a] text-brand-bg',
};

export const OverlayLinkButton = ({
  href,
  label,
  srLabel,
  variant = 'primary',
  className,
  textClassName,
  fullWidth = false,
}: OverlayLinkButtonProps) => {
  const isExternalLink = /^https?:\/\//.test(href);

  return (
    <div
      className={clsx(
        'relative rounded-none',
        VARIANT_CLASSNAMES[variant],
        fullWidth && 'w-full',
        className,
      )}
      style={{ borderRadius: 0 }}
    >
      <div aria-hidden='true' className={textClassName} style={{ whiteSpace: 'nowrap', cursor: 'auto', textUnderlineOffset: 'auto', pointerEvents: 'none' }}>
        {label}
      </div>
      <a
        href={href}
        target={isExternalLink ? '_blank' : undefined}
        rel={isExternalLink ? 'noopener noreferrer' : undefined}
        className='absolute inset-0 block'
        aria-label={srLabel ?? label}
      >
        <span className='sr-only'>{srLabel ?? label}</span>
      </a>
    </div>
  );
};
