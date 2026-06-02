import clsx from 'clsx';
import type { ReactNode } from 'react';

interface OverlayLinkButtonProps {
  href: string;
  label: string;
  srLabel?: string;
  variant?: 'primary' | 'outline' | 'lightbrown' | 'accent';
  size?: 'default' | 'lg';
  className?: string;
  textClassName?: string;
  wrapperStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  icon?: ReactNode;
  iconSrc?: string;
  iconAlt?: string;
  fullWidth?: boolean;
  // Optional Webflow data-wf-el attribute names to mirror the live
  // `<div class="button-N"><div class="btn-text-N">…</div></div>`
  // structure for parity tooling that walks data-wf-el labels.
  wfEl?: string;
  textWfEl?: string;
  iconWrapWfEl?: string;
  iconColorWfEl?: string;
  iconWfEl?: string;
  linkWfEl?: string;
}

const VARIANT_CONFIG: Record<NonNullable<OverlayLinkButtonProps['variant']>, { cls: string; isWrap: boolean }> = {
  primary: { cls: 'btn-wrap-primary', isWrap: true },
  outline: { cls: 'btn-wrap', isWrap: true },
  lightbrown: { cls: 'btn-wrap-dark', isWrap: true },
  accent: { cls: 'btn-wrap-accent', isWrap: true },
};

const SIZE_CONFIG = {
  default: { fontSize: '16px', lineHeight: '20.8px', padding: undefined, boxShadow: undefined, iconPx: 19.1875 },
  lg: {
    fontSize: '18px',
    lineHeight: '23.4px',
    padding: '18px 38.4px',
    boxShadow: '0 8px 24px rgba(34, 21, 13, 0.28)',
    iconPx: 20,
  },
} as const;

export const OverlayLinkButton = ({
  href,
  label,
  srLabel,
  variant = 'primary',
  size = 'default',
  className,
  textClassName,
  wrapperStyle,
  textStyle: customTextStyle,
  icon,
  iconSrc,
  iconAlt = '',
  fullWidth = false,
  wfEl,
  textWfEl,
  iconWrapWfEl,
  iconColorWfEl,
  iconWfEl,
  linkWfEl,
}: OverlayLinkButtonProps) => {
  const isExternalLink = /^https?:\/\//.test(href);
  const config = VARIANT_CONFIG[variant];
  const sizeConfig = SIZE_CONFIG[size];

  // Live's `.button-N` outer wrap has cursor:auto and a 10px
  // margin-bottom (Webflow's default form-control margin); inheriting
  // pointer cursor from the inner anchor was causing wfMismatch noise.
  const baseStyle: React.CSSProperties = {
    textUnderlineOffset: 'auto',
    cursor: 'auto',
    marginBottom: '10px',
  };

  const textStyle: React.CSSProperties = {
    display: 'block',
    whiteSpace: 'nowrap',
    cursor: 'auto',
    textUnderlineOffset: 'auto',
    pointerEvents: 'none',
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
      style={
        config.isWrap
          ? {
              ...baseStyle,
              ...(sizeConfig.padding
                ? {
                    padding: sizeConfig.padding,
                    fontSize: sizeConfig.fontSize,
                    lineHeight: sizeConfig.lineHeight,
                    ...(sizeConfig.boxShadow ? { boxShadow: sizeConfig.boxShadow } : {}),
                  }
                : {}),
              ...wrapperStyle,
            }
          : { ...baseStyle, borderRadius: 0, ...wrapperStyle }
      }
    >
      {iconSrc || icon ? (
        <div
          data-wf-el={iconWrapWfEl}
          aria-hidden='true'
          style={{
            display: 'flex',
            width: `${sizeConfig.iconPx}px`,
            height: `${sizeConfig.iconPx}px`,
            maxWidth: `${sizeConfig.iconPx}px`,
            justifyContent: 'center',
            alignItems: 'center',
            lineHeight: '16px',
            flexShrink: 0,
          }}
        >
          <div
            data-wf-el={iconColorWfEl}
            style={{ display: 'flex', color: variant === 'primary' ? 'rgb(255, 255, 139)' : 'currentColor' }}
          >
            {iconSrc ? (
              <img
                data-wf-el={iconWfEl}
                src={iconSrc}
                alt={iconAlt}
                style={{ display: 'block', width: `${sizeConfig.iconPx}px`, height: `${sizeConfig.iconPx}px`, objectFit: 'fill' }}
              />
            ) : (
              icon
            )}
          </div>
        </div>
      ) : null}
      <div data-wf-el={textWfEl} aria-hidden='true' className={textClassName} style={{ ...textStyle, ...customTextStyle }}>
        {label}
      </div>
      {/* Live's overlay anchor (`.u-link-cover.w-inline-block`) carries
        * the visible underline rather than the inner btn-text wrapper —
        * computed style: `text-decoration: underline 1.6px; font-size: 16px;
        * line-height: 20.8px`.  Mirroring those here so the parity check
        * matches `A:build with sdk` / `A:contact us` text-decoration. */}
      <a
        data-wf-el={linkWfEl}

        href={href}
        target={isExternalLink ? '_blank' : undefined}
        rel={isExternalLink ? 'noopener noreferrer' : undefined}
        className='absolute inset-0 block'
        style={{
          textDecoration: 'underline',
          textDecorationThickness: '1.6px',
          textUnderlineOffset: '3px',
          fontSize: sizeConfig.fontSize,
          lineHeight: sizeConfig.lineHeight,
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
