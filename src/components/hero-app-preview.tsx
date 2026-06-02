import React from 'react';
import { domAnimation, LazyMotion, m } from 'framer-motion';

export type HeroAppPreviewSlide = {
  src: string;
  alt: string;
};

const CROSSFADE_MS = 5000;
const FADE_DURATION_S = 0.75;

interface HeroAppPreviewProps {
  slides: HeroAppPreviewSlide[];
}

export const HeroAppPreview: React.FC<HeroAppPreviewProps> = ({ slides }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (slides.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, CROSSFADE_MS);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  const activeSlide = slides[activeIndex] ?? slides[0];

  return (
    <div
      data-testid='hero-app-preview'
      className='overflow-hidden rounded-lg border border-[rgba(34,21,13,0.2)] bg-[#ebe4d4] shadow-[0_12px_40px_rgba(34,21,13,0.08)]'
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
  );
};
