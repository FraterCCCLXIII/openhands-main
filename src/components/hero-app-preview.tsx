import React from 'react';
import { domAnimation, LazyMotion, m } from 'framer-motion';

export type HeroAppPreviewSlide = {
  src: string;
  alt: string;
};

const CROSSFADE_MS = 5000;
const FADE_DURATION_S = 0.75;
const RESTING_SCALE = 0.92;
const PEAK_SCALE = 1.12;
const PEAK_SHADOW_ALPHA = 0.22;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export type HeroPreviewScrollDirection = 'up' | 'down';

export function computeHeroPreviewScrollEffect(
  rect: DOMRect,
  viewportHeight: number,
  scrollDirection: HeroPreviewScrollDirection,
) {
  const center = rect.top + rect.height / 2;
  const viewportCenter = viewportHeight / 2;
  const start = viewportHeight;
  const progress = clamp((start - center) / (start - viewportCenter), 0, 1);
  const approachScale = RESTING_SCALE + (PEAK_SCALE - RESTING_SCALE) * progress;
  const approachShadow = PEAK_SHADOW_ALPHA * progress;

  if (scrollDirection === 'down' && center < viewportCenter) {
    return { scale: PEAK_SCALE, shadow: PEAK_SHADOW_ALPHA };
  }

  return { scale: approachScale, shadow: approachShadow };
}

interface HeroAppPreviewProps {
  slides: HeroAppPreviewSlide[];
}

export const HeroAppPreview: React.FC<HeroAppPreviewProps> = ({ slides }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const shellRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const shell = shellRef.current;
    const card = cardRef.current;
    if (!shell || !card) return undefined;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastScrollY = window.scrollY;
    let scrollDirection: HeroPreviewScrollDirection = 'down';

    const applyScrollStyles = () => {
      if (prefersReducedMotion) {
        card.style.removeProperty('transform');
        card.style.removeProperty('box-shadow');
        return;
      }

      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY) {
        scrollDirection = 'up';
      } else if (currentScrollY > lastScrollY) {
        scrollDirection = 'down';
      }
      lastScrollY = currentScrollY;

      const { scale, shadow } = computeHeroPreviewScrollEffect(
        shell.getBoundingClientRect(),
        window.innerHeight,
        scrollDirection,
      );

      card.style.transform = `scale(${scale})`;
      card.style.boxShadow =
        shadow > 0.01
          ? `0 28px 70px -16px rgba(34, 21, 13, ${shadow}), 0 12px 40px rgba(34, 21, 13, ${shadow * 0.55})`
          : 'none';
    };

    applyScrollStyles();

    if (prefersReducedMotion) {
      return undefined;
    }

    let frame = 0;
    const loop = () => {
      applyScrollStyles();
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);

    window.addEventListener('scroll', applyScrollStyles, { passive: true });
    window.addEventListener('resize', applyScrollStyles, { passive: true });
    document.addEventListener('scroll', applyScrollStyles, { passive: true, capture: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', applyScrollStyles);
      window.removeEventListener('resize', applyScrollStyles);
      document.removeEventListener('scroll', applyScrollStyles, true);
      card.style.removeProperty('transform');
      card.style.removeProperty('box-shadow');
    };
  }, []);

  React.useEffect(() => {
    if (slides.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, CROSSFADE_MS);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  const activeSlide = slides[activeIndex] ?? slides[0];

  return (
    <div ref={shellRef} className='hero-app-preview-shell origin-center'>
      <div
        ref={cardRef}
        data-testid='hero-app-preview'
        className='origin-center overflow-hidden rounded-lg border border-[rgba(34,21,13,0.2)] bg-[#ebe4d4]'
      >
        <div
          data-wf-el='hero-preview-chrome'
          className='flex items-center border-b border-[rgba(34,21,13,0.12)] px-3 py-2.5'
          aria-hidden='true'
        >
          <div className='flex shrink-0 items-center gap-1.5'>
            <span className='h-2.5 w-2.5 rounded-full bg-[#22150d]/35' />
            <span className='h-2.5 w-2.5 rounded-full bg-[#22150d]/35' />
            <span className='h-2.5 w-2.5 rounded-full bg-[#22150d]/35' />
          </div>
        </div>

        {/* Screenshots are 1280×720 (16:9); match that ratio and contain so nothing is cropped. */}
        <div className='relative aspect-video w-full overflow-hidden bg-[#f3ede0]'>
          <LazyMotion features={domAnimation}>
            {slides.map((slide, index) => (
              <m.img
                key={slide.src}
                src={slide.src}
                alt={index === activeIndex ? slide.alt : ''}
                data-wf-el='hero-preview-slide'
                aria-hidden={index !== activeIndex || undefined}
                animate={{ opacity: index === activeIndex ? 1 : 0 }}
                transition={{ duration: FADE_DURATION_S, ease: 'easeInOut' }}
                className='absolute inset-0 block h-full w-full object-contain object-center'
                style={{ zIndex: index === activeIndex ? 1 : 0 }}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding='async'
              />
            ))}
          </LazyMotion>
        </div>

        <p className='sr-only' aria-live='polite'>
          {activeSlide.alt}
        </p>
      </div>
    </div>
  );
};
