import { useEffect, useState, type RefObject } from "react";

/**
 * Whether the element is on screen right now: unlike `useInView`, it turns
 * false again when the element scrolls away. True where IntersectionObserver
 * is unavailable.
 */
export const useIsVisible = (ref: RefObject<Element | null>): boolean => {
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (last) setVisible(last.isIntersecting);
      },
      { rootMargin: "100px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return visible;
};
