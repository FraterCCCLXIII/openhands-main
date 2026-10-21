import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  readVerticalScrollFadeState,
  type VerticalScrollFadeState,
} from "#/utils/scroll-fade-state";
import { cn } from "#/utils/utils";

const FADE_HEIGHT_CLASS = "h-10";

interface ConversationMinimapVerticalScrollProps {
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
  testId?: string;
  fadeTestIdPrefix: string;
  /** Re-run fade measurement when scroll content size changes. */
  observeKey?: string;
  /** When true, show an always-visible scrollbar instead of hiding it. */
  showScrollbar?: boolean;
  style?: React.CSSProperties;
  id?: string;
  role?: React.AriaRole;
  "aria-label"?: string;
}

export const ConversationMinimapVerticalScroll = forwardRef<
  HTMLDivElement,
  ConversationMinimapVerticalScrollProps
>(function ConversationMinimapVerticalScroll(
  {
    children,
    className,
    scrollClassName,
    testId,
    fadeTestIdPrefix,
    observeKey = "",
    showScrollbar = false,
    style,
    id,
    role,
    "aria-label": ariaLabel,
  },
  forwardedRef,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeState, setFadeState] = useState<VerticalScrollFadeState>({
    top: false,
    bottom: false,
  });

  const setScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        const refObject = forwardedRef;
        refObject.current = node;
      }
    },
    [forwardedRef],
  );

  const updateFadeState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    const next = readVerticalScrollFadeState(element);
    setFadeState((current) =>
      current.top === next.top && current.bottom === next.bottom
        ? current
        : next,
    );
  }, []);

  useLayoutEffect(() => {
    updateFadeState();

    const element = scrollRef.current;
    if (!element) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(updateFadeState);
    resizeObserver.observe(element);
    Array.from(element.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    return () => resizeObserver.disconnect();
  }, [updateFadeState, observeKey]);

  return (
    <div className={cn("relative", className)} style={style}>
      <div
        ref={setScrollRef}
        data-testid={testId}
        id={id}
        role={role}
        aria-label={ariaLabel}
        onScroll={updateFadeState}
        className={cn(
          "overflow-y-auto",
          showScrollbar ? "custom-scrollbar-always" : "scrollbar-hide",
          scrollClassName,
        )}
      >
        {children}
      </div>
      <div
        aria-hidden
        data-testid={`${fadeTestIdPrefix}-fade-top`}
        data-visible={fadeState.top ? "true" : "false"}
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10",
          FADE_HEIGHT_CLASS,
          "bg-gradient-to-b from-[var(--oh-scroll-fade-from,var(--oh-color-base))] to-transparent",
          "transition-opacity duration-300 ease-out motion-reduce:transition-none",
          fadeState.top ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        data-testid={`${fadeTestIdPrefix}-fade-bottom`}
        data-visible={fadeState.bottom ? "true" : "false"}
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10",
          FADE_HEIGHT_CLASS,
          "bg-gradient-to-t from-[var(--oh-scroll-fade-from,var(--oh-color-base))] to-transparent",
          "transition-opacity duration-300 ease-out motion-reduce:transition-none",
          fadeState.bottom ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
});
