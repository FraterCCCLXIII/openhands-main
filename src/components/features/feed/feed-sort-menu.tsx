import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { ContextMenuListItem } from "#/components/features/context-menu/context-menu-list-item";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { I18nKey } from "#/i18n/declaration";
import { ContextMenu } from "#/ui/context-menu";
import { FEED_SORTS, type FeedSort } from "#/utils/feed-sort";
import { cn } from "#/utils/utils";

const SORT_LABEL: Record<FeedSort, I18nKey> = {
  latest: I18nKey.FEED$SORT_LATEST,
  oldest: I18nKey.FEED$SORT_OLDEST,
  title: I18nKey.FEED$SORT_TITLE,
  agent: I18nKey.FEED$GROUP_BY_AGENT,
};

interface FeedSortMenuProps {
  sort: FeedSort;
  onChange: (sort: FeedSort) => void;
  className?: string;
}

/** Dropdown that picks how the feed is ordered or stacked. */
export function FeedSortMenu({ sort, onChange, className }: FeedSortMenuProps) {
  const { t } = useTranslation("openhands");
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useClickOutsideElement<HTMLUListElement>(
    () => setOpen(false),
    triggerRef,
  );

  return (
    <div ref={triggerRef} className={cn("relative", className)}>
      <button
        type="button"
        data-testid="feed-sort-trigger"
        aria-label={t(I18nKey.FEED$SORT_LABEL)}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1.5 text-xs text-contrast hover:bg-surface"
      >
        <ArrowUpDown size={14} aria-hidden />
        {t(SORT_LABEL[sort])}
        <ChevronDown size={14} aria-hidden />
      </button>
      {open ? (
        <ContextMenu
          ref={menuRef}
          testId="feed-sort-menu"
          alignment="right"
          position="bottom"
          className="min-w-52"
        >
          {FEED_SORTS.map((option) => (
            <ContextMenuListItem
              key={option}
              testId={`feed-sort-${option}`}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              <span className="flex items-center gap-2">
                <Check
                  size={14}
                  aria-hidden
                  className={option === sort ? "" : "invisible"}
                />
                {t(SORT_LABEL[option])}
              </span>
            </ContextMenuListItem>
          ))}
        </ContextMenu>
      ) : null}
    </div>
  );
}
