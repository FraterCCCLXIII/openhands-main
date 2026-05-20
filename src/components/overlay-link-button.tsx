import clsx from 'clsx';

interface OverlayLinkButtonProps {
  href: string;
  label: string;
  srLabel?: string;
  variant?: 'primary' | 'outline' | 'lightbrown';
  className?: string;
  textClassName?: string;
  wrapperStyle?: React.CSSProperties;
  iconSrc?: string;
  iconAlt?: string;
  fullWidth?: boolean;
  // Optional Webflow data-wf-el attribute names to mirror the live
  // `<div class="button-N"><div class="btn-text-N">…</div></div>`
  // structure for parity tooling that walks data-wf-el labels.
  wfEl?: string;
  textWfEl?: string;
}

const VARIANT_CONFIG: Record<NonNullable<OverlayLinkButtonProps['variant']>, { cls: string; isWrap: boolean }> = {
  primary: { cls: 'btn-wrap-primary', isWrap: true },
  outline: { cls: 'btn-wrap', isWrap: true },
  lightbrown: { cls: 'btn-wrap-dark', isWrap: true },
};

export const OverlayLinkButton = ({
  href,
  label,
  srLabel,
  variant = 'primary',
  className,
  textClassName,
  wrapperStyle,
  iconSrc,
  iconAlt = '',
  fullWidth = false,
  wfEl,
  textWfEl,
}: OverlayLinkButtonProps) => {
  const isExternalLink = /^https?:\/\//.test(href);
  const config = VARIANT_CONFIG[variant];

  // Live's `.button-N` outer wrap has cursor:auto and a 10px
  // margin-bottom (Webflow's default form-control margin); inheriting
  // pointer cursor from the inner anchor was causing wfMismatch noise.
  const baseStyle: React.CSSProperties = {
    textUnderlineOffset: 'auto',
    cursor: 'auto',
    marginBottom: '10px',
  };

  return (
    <div
      data-wf-el={wfEl}
      className={clsx(
        'relative',
        !config.isWrap && 'rounded-none',
        config.cls,
        fullWidth && 'w-full',
        className,
      )}
      style={config.isWrap ? { ...baseStyle, ...wrapperStyle } : { ...baseStyle, borderRadius: 0, ...wrapperStyle }}
    >
      <div data-wf-el={textWfEl} aria-hidden='true' className={textClassName} style={{ display: 'block', whiteSpace: 'nowrap', cursor: 'auto', textUnderlineOffset: 'auto', pointerEvents: 'none' }}>
        {iconSrc ? <img src={iconSrc} alt={iconAlt} style={{ width: '19px', height: '19px', objectFit: 'fill' }} /> : null}
        {label}
      </div>
      {/* Live's overlay anchor (`.u-link-cover.w-inline-block`) carries
        * the visible underline rather than the inner btn-text wrapper —
        * computed style: `text-decoration: underline 1.6px; font-size: 16px;
        * line-height: 20.8px`.  Mirroring those here so the parity check
        * matches `A:build with sdk` / `A:contact us` text-decoration. */}
      <a
        href={href}
        target={isExternalLink ? '_blank' : undefined}
        rel={isExternalLink ? 'noopener noreferrer' : undefined}
        className='absolute inset-0 block'
        style={{
          textDecoration: 'underline',
          textDecorationThickness: '1.6px',
          textUnderlineOffset: '3px',
          fontSize: '16px',
          lineHeight: '20.8px',
          maxWidth: '100%',
          // Inherit color from .btn-wrap-* parent so the overlay anchor's
          // color/textDecorationColor matches live (e.g. #F9F0D9 inside
          // .btn-wrap-primary instead of body brand-fg).
          color: 'inherit',
        }}
        aria-label={srLabel ?? label}
      >
        <span className='sr-only'>{srLabel ?? label}</span>
      </a>
    </div>
  );
};
