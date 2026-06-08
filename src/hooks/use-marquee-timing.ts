import React from 'react';

type MarqueeTimingOptions = {
  pixelsPerSecond?: number;
  distanceProperty?: string;
  durationProperty?: string;
};

export function useMarqueeTiming(
  marqueeRef: React.RefObject<HTMLElement | null>,
  trackRef: React.RefObject<HTMLElement | null>,
  groupRef: React.RefObject<HTMLElement | null>,
  options: MarqueeTimingOptions = {},
) {
  const {
    pixelsPerSecond = 36,
    distanceProperty = '--marquee-distance',
    durationProperty = '--marquee-duration',
  } = options;

  React.useEffect(() => {
    const marquee = marqueeRef.current;
    const track = trackRef.current;
    const group = groupRef.current;
    if (!marquee || !track || !group || typeof window === 'undefined') return undefined;

    const updateMarqueeTiming = () => {
      const distance = group.getBoundingClientRect().width;
      if (distance <= 0) return;

      marquee.style.setProperty(distanceProperty, `${distance}px`);
      marquee.style.setProperty(durationProperty, `${distance / pixelsPerSecond}s`);

      track.style.animation = 'none';
      void track.offsetHeight;
      track.style.animation = '';
    };

    updateMarqueeTiming();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateMarqueeTiming);
      resizeObserver.observe(group);
      resizeObserver.observe(marquee);
    }

    window.addEventListener('pageshow', updateMarqueeTiming);
    window.addEventListener('resize', updateMarqueeTiming);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('pageshow', updateMarqueeTiming);
      window.removeEventListener('resize', updateMarqueeTiming);
    };
  }, [distanceProperty, durationProperty, groupRef, marqueeRef, pixelsPerSecond, trackRef]);
}
