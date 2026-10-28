import type { ReactNode } from "react";
import { useNavigation } from "#/context/navigation-context";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useFeedConversations } from "#/hooks/use-feed-conversations";
import { useFeedFilterStore } from "#/stores/feed-filter-store";
import type { FeedFilter } from "#/utils/feed-filters";
import { FeedContactsSidebar } from "./feed-contacts-sidebar";
import { FeedFilterSidebar } from "./feed-filter-sidebar";

interface FeedColumnsProps {
  children: ReactNode;
  /** Picking a filter here also opens the feed, for pages that are not it. */
  openFeedOnFilter?: boolean;
}

/**
 * Facebook-style three columns: filters on the left, the page in the middle,
 * contacts on the right. The feed and every profile page share it.
 */
export function FeedColumns({ children, openFeedOnFilter }: FeedColumnsProps) {
  const { conversations } = useFeedConversations();
  const filter = useFeedFilterStore((state) => state.filter);
  const setFilter = useFeedFilterStore((state) => state.setFilter);
  const { navigate } = useNavigation();
  const backendScopedPath = useBackendScopedPath();

  const handleChange = (next: FeedFilter) => {
    setFilter(next);
    if (openFeedOnFilter) navigate(backendScopedPath("/feed"));
  };

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <aside className="custom-scrollbar-always w-full shrink-0 overflow-y-auto border-border px-2 py-4 max-md:max-h-40 md:w-60 lg:w-[360px]">
        <FeedFilterSidebar
          conversations={conversations}
          filter={filter}
          onChange={handleChange}
        />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      <aside
        data-testid="feed-contacts"
        className="custom-scrollbar-always hidden w-[360px] shrink-0 overflow-y-auto px-2 py-4 xl:block"
      >
        <FeedContactsSidebar
          conversations={conversations}
          filter={filter}
          onChange={handleChange}
        />
      </aside>
    </div>
  );
}
