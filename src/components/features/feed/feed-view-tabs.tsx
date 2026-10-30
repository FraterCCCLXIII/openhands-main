import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Inbox, Newspaper, type LucideIcon } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import type { FeedView } from "#/hooks/use-feed-view";
import { cn } from "#/utils/utils";

export type { FeedView };

const FEED_VIEWS: Array<{ view: FeedView; label: I18nKey; Icon: LucideIcon }> =
  [
    { view: "feed", label: I18nKey.FEED$TITLE, Icon: Newspaper },
    {
      view: "notifications",
      label: I18nKey.FEED$TAB_NOTIFICATIONS,
      Icon: Bell,
    },
    { view: "inbox", label: I18nKey.FEED$INBOX, Icon: Inbox },
  ];

interface PillBox {
  left: number;
  width: number;
}

interface FeedViewTabsProps {
  view: FeedView;
  onChange: (view: FeedView) => void;
}

/**
 * The Feed / Notifications pill toggle. The highlight slides between tabs with
 * a CSS transition on its offset inside the tab row, so it only moves when the
 * selection changes. A shared-layout animation would instead chase every shift
 * of the row on the page, such as the factory header appearing above it.
 */
export function FeedViewTabs({ view, onChange }: FeedViewTabsProps) {
  const { t } = useTranslation("openhands");
  const rowRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<PillBox | null>(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;
    const measure = () => {
      const active = row.querySelector<HTMLElement>('[aria-selected="true"]');
      // Without layout (jsdom) the active tab paints its own highlight.
      setPill(
        active && active.offsetWidth > 0
          ? { left: active.offsetLeft, width: active.offsetWidth }
          : null,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [view]);

  // Arrow keys move between tabs, as the roving tab stop promises.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const index = FEED_VIEWS.findIndex((tab) => tab.view === view);
    const next =
      FEED_VIEWS[(index + step + FEED_VIEWS.length) % FEED_VIEWS.length].view;
    event.preventDefault();
    onChange(next);
    requestAnimationFrame(() =>
      document.getElementById(`feed-tab-${next}`)?.focus(),
    );
  };

  return (
    <div
      ref={rowRef}
      role="tablist"
      data-testid="feed-tabs"
      aria-label={t(I18nKey.FEED$TITLE)}
      className="relative inline-flex items-center rounded-full bg-[var(--oh-surface-raised)] p-1 text-sm font-medium"
    >
      {pill ? (
        <span
          aria-hidden
          data-testid="feed-tabs-pill"
          className="absolute inset-y-1 left-0 rounded-full bg-[var(--oh-interactive-hover)] transition-[transform,width] duration-200 ease-out motion-reduce:transition-none"
          ref={(el) => {
            el?.style.setProperty("width", `${pill.width}px`);
            el?.style.setProperty("transform", `translateX(${pill.left}px)`);
          }}
        />
      ) : null}
      {FEED_VIEWS.map(({ view: tabView, label, Icon }) => {
        const isActive = view === tabView;
        return (
          <button
            key={tabView}
            type="button"
            role="tab"
            id={`feed-tab-${tabView}`}
            data-testid={`feed-tab-${tabView}`}
            aria-selected={isActive}
            aria-controls="feed-tabpanel"
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tabView)}
            onKeyDown={onKeyDown}
            className={cn(
              "relative z-10 inline-flex items-center gap-2 rounded-full px-5 py-2",
              "cursor-pointer transition-colors",
              isActive
                ? "text-contrast"
                : "text-[var(--oh-muted)] hover:text-contrast",
              isActive && !pill && "bg-[var(--oh-interactive-hover)]",
            )}
          >
            <Icon size={16} aria-hidden className="shrink-0" />
            <span>{t(label)}</span>
          </button>
        );
      })}
    </div>
  );
}
