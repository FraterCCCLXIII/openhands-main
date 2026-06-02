import { useCallback, type CSSProperties } from 'react';
import type { PixelBlastProps } from '~/components/PixelBlast/PixelBlast';
import { usePixelBlastHostRegistration } from '~/contexts/pixel-blast-context';

export const PIXEL_BLAST_BACKGROUND_PROPS: PixelBlastProps = {
  variant: 'circle',
  pixelSize: 8,
  color: '#22150d',
  patternScale: 2,
  patternDensity: 1.3,
  enableRipples: true,
  rippleSpeed: 0.75,
  rippleThickness: 0.5,
  rippleIntensityScale: 2.4,
  speed: 1.1,
  transparent: true,
  edgeFade: 0,
  antialias: false,
};

type PixelBlastBackgroundProps = {
  className?: string;
};

/**
 * Parity shell for Webflow `asci-embed` / `ascii-embed` markup. The actual
 * WebGL animation is rendered once via `PixelBlastRenderer` and portaled
 * into the most visible host on the page.
 */
export function PixelBlastBackground({ className = '' }: PixelBlastBackgroundProps) {
  const registerHost = usePixelBlastHostRegistration();

  const hostRef = useCallback(
    (node: HTMLDivElement | null) => {
      registerHost(node);
    },
    [registerHost],
  );

  const surfaceStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    opacity: 'var(--ascii-opacity, 0.12)',
  };

  return (
    <div data-wf-el='asci-embed' className={`h-full w-full overflow-hidden ${className}`.trim()}>
      <div
        ref={hostRef}
        data-wf-el='ascii-embed'
        className='ascii-embed hero-pixel-blast'
        style={surfaceStyle}
      />
    </div>
  );
}

/** @deprecated Use `PixelBlastBackground` */
export const HeroPixelBlastBackground = PixelBlastBackground;
