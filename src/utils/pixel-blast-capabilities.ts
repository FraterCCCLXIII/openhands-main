/** Returns true when WebGL pixel animation should be skipped (reduced motion). */
export function shouldDisablePixelBlastAnimation(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Max device pixel ratio for the pixel blast canvas (lower = less GPU work). */
export const PIXEL_BLAST_MAX_DEVICE_PIXEL_RATIO = 2;
