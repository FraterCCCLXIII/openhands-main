import { useEffect, useState, type CSSProperties, type ComponentType } from 'react';
import type { PixelBlastProps } from '~/components/PixelBlast/PixelBlast';

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
};

type PixelBlastBackgroundProps = {
  className?: string;
};

export function PixelBlastBackground({ className = '' }: PixelBlastBackgroundProps) {
  const [PixelBlast, setPixelBlast] = useState<ComponentType<PixelBlastProps> | null>(null);

  useEffect(() => {
    let cancelled = false;

    import('~/components/PixelBlast/PixelBlast').then((mod) => {
      if (!cancelled) {
        setPixelBlast(() => mod.default);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const surfaceStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    opacity: 'var(--ascii-opacity, 0.12)',
  };

  return (
    <div data-wf-el='asci-embed' className={`h-full w-full overflow-hidden ${className}`.trim()}>
      <div data-wf-el='ascii-embed' className='ascii-embed hero-pixel-blast' style={surfaceStyle}>
        {PixelBlast ? <PixelBlast {...PIXEL_BLAST_BACKGROUND_PROPS} style={{ width: '100%', height: '100%' }} /> : null}
      </div>
    </div>
  );
}

/** @deprecated Use `PixelBlastBackground` */
export const HeroPixelBlastBackground = PixelBlastBackground;
