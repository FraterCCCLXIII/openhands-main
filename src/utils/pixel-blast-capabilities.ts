/** Returns true when WebGL pixel animation should be skipped (mobile / reduced motion). */
export function shouldDisablePixelBlastAnimation(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }

  if (window.matchMedia('(max-width: 768px)').matches) {
    return true;
  }

  return false;
}

/** Max device pixel ratio for the pixel blast canvas (lower = less GPU work). */
export const PIXEL_BLAST_MAX_DEVICE_PIXEL_RATIO = 1;
