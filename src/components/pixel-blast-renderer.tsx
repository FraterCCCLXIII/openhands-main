import { useEffect, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import type { PixelBlastProps } from '~/components/PixelBlast/PixelBlast';
import {
  PIXEL_BLAST_BACKGROUND_PROPS,
} from '~/components/pixel-blast-background';
import { usePixelBlastContext } from '~/contexts/pixel-blast-context';
import { shouldDisablePixelBlastAnimation } from '~/utils/pixel-blast-capabilities';

/**
 * Single shared WebGL pixel animation instance. Portals into whichever
 * `.hero-pixel-blast` host is most visible in the viewport.
 */
export function PixelBlastRenderer() {
  const { activeHost, activeHostId } = usePixelBlastContext();
  const [PixelBlast, setPixelBlast] = useState<ComponentType<PixelBlastProps> | null>(null);
  const [animationEnabled, setAnimationEnabled] = useState(() => !shouldDisablePixelBlastAnimation());

  useEffect(() => {
    if (shouldDisablePixelBlastAnimation()) {
      return;
    }

    let cancelled = false;

    import('~/components/PixelBlast/PixelBlast').then((mod) => {
      if (!cancelled) {
        setPixelBlast(() => mod.default as ComponentType<PixelBlastProps>);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateEnabled = () => {
      setAnimationEnabled(!shouldDisablePixelBlastAnimation());
    };

    motionQuery.addEventListener('change', updateEnabled);

    return () => {
      motionQuery.removeEventListener('change', updateEnabled);
    };
  }, []);

  if (!animationEnabled || !activeHost || !activeHostId || !PixelBlast) {
    return null;
  }

  return createPortal(
    <PixelBlast
      key={activeHostId}
      {...PIXEL_BLAST_BACKGROUND_PROPS}
      style={{ width: '100%', height: '100%' }}
    />,
    activeHost,
  );
}
