import { useEffect, useState, type RefObject } from "react";

/**
 * True once the element has scrolled into view (and stays true). Used to defer
 * per-card requests until a card is actually near the viewport. Falls back to
 * true where IntersectionObserver is unavailable.
 */
export const useInView = (ref: RefObject<Element | null>): boolean => {
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const el = ref.current;
    if (inView || !el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, inView]);

  return inView;
};
