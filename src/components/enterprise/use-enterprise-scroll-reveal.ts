import { useEffect, useRef, useState } from 'react';

const REVEAL_THRESHOLD = 0.35;
const REVEAL_ROOT_MARGIN = '0px 0px -8% 0px';

export function useEnterpriseScrollReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return undefined;
    }

    const activate = () => setIsActive(true);

    const isInView = () => {
      const rect = root.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      return rect.top < viewportHeight * 0.85 && rect.bottom > viewportHeight * 0.15;
    };

    setShouldAnimate(true);

    if (isInView()) {
      requestAnimationFrame(() => activate());
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          activate();
          observer.disconnect();
        }
      },
      { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return { rootRef, shouldAnimate, isActive };
}
