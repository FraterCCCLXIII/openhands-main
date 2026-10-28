import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { AnimatedCollapse } from "#/components/shared/animated-collapse";
import { cn } from "#/utils/utils";

const USER_MESSAGE_SELECTOR = '[data-testid="user-message"]';

/**
 * True while the newest user message in the scroll container sits above the
 * visible area. Without IntersectionObserver (jsdom, very old browsers) it
 * reports true so the bar still renders instead of crashing.
 */
function useLastUserMessageAbove(
  scrollRef: React.RefObject<HTMLElement | null>,
  messageKey: string,
) {
  const [isAbove, setIsAbove] = React.useState(
    () => typeof IntersectionObserver === "undefined",
  );

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setIsAbove(true);
      return undefined;
    }
    const root = scrollRef.current;
    const messages = root?.querySelectorAll(USER_MESSAGE_SELECTOR);
    const target = messages?.[messages.length - 1];
    if (!root || !target) {
      setIsAbove(false);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        const rootTop =
          entry.rootBounds?.top ?? root.getBoundingClientRect().top;
        setIsAbove(
          !entry.isIntersecting && entry.boundingClientRect.top < rootTop,
        );
      },
      { root },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [scrollRef, messageKey]);

  return isAbove;
}

interface StickyLastPromptProps {
  /** Text of the user's latest message. */
  text: string;
  /** Changes whenever the latest message changes, so it is observed again. */
  messageKey: string;
  scrollRef: React.RefObject<HTMLElement | null>;
}

/**
 * Compact bar pinned to the top of the chat scroll area while the user's last
 * prompt is scrolled out of view. Click to unroll the whole prompt.
 *
 * The wrapper has zero height (its flex gap is cancelled by -mb-2), so showing
 * or hiding the bar never shifts the messages underneath it.
 */
export function StickyLastPrompt({
  text,
  messageKey,
  scrollRef,
}: StickyLastPromptProps) {
  const { t } = useTranslation("openhands");
  const [expanded, setExpanded] = React.useState(false);
  const isAbove = useLastUserMessageAbove(scrollRef, messageKey);

  React.useEffect(() => {
    setExpanded(false);
  }, [messageKey]);

  if (!isAbove || !text.trim()) return null;

  return (
    <div
      data-testid="sticky-last-prompt"
      className="sticky top-0 z-10 -mb-2 h-0 w-full"
    >
      <div className="absolute inset-x-0 top-0 mx-auto w-full max-w-200 border-b border-border-input bg-background shadow-sm">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={t(I18nKey.CHAT_INTERFACE$LAST_PROMPT)}
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full min-w-0 cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary"
        >
          <span className="min-w-0 grow truncate">{text}</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 transition-transform duration-300 motion-reduce:transition-none",
              expanded && "rotate-180",
            )}
          />
        </button>
        <AnimatedCollapse open={expanded}>
          <div
            data-testid="sticky-last-prompt-full"
            className="max-h-60 overflow-y-auto px-3 pb-2 text-sm wrap-break-word whitespace-pre-wrap text-text-secondary"
          >
            {text}
          </div>
        </AnimatedCollapse>
      </div>
    </div>
  );
}
