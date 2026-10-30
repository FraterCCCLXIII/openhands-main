import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useFeedSectionsStore } from "#/stores/feed-sections-store";
import { cn } from "#/utils/utils";

interface FeedSectionProps {
  /** Stable id: the persistence key and the DOM id of the content. */
  id: string;
  title: string;
  testId?: string;
  /** Beside the title, such as an unread count. */
  badge?: ReactNode;
  /** Right of the header, such as the plus menu. */
  action?: ReactNode;
  children: (open: boolean) => ReactNode;
}

/**
 * A left-panel section with a disclosure caret: the header button toggles the
 * content, which stays mounted (hidden) so its state and data survive.
 */
export function FeedSection({
  id,
  title,
  testId,
  badge,
  action,
  children,
}: FeedSectionProps) {
  const open = useFeedSectionsStore((state) => !state.collapsed[id]);
  const toggle = useFeedSectionsStore((state) => state.toggle);
  const contentId = `feed-section-${id}`;

  return (
    <section data-testid={testId}>
      <div className="mb-1 flex items-center gap-1 px-2">
        <h2 className="min-w-0 flex-1 text-[17px] font-semibold text-muted">
          <button
            type="button"
            data-testid={`feed-section-toggle-${id}`}
            aria-expanded={open}
            aria-controls={contentId}
            onClick={() => toggle(id)}
            className="flex w-full items-center gap-1 rounded-md py-0.5 text-left transition-colors hover:text-contrast focus-visible:outline focus-visible:outline-2"
          >
            <ChevronRight
              size={16}
              aria-hidden
              className={cn(
                "shrink-0 transition-transform motion-reduce:transition-none",
                open && "rotate-90",
              )}
            />
            <span className="truncate">{title}</span>
            {badge}
          </button>
        </h2>
        {action}
      </div>
      <div id={contentId} className={cn(!open && "hidden")}>
        {children(open)}
      </div>
    </section>
  );
}
