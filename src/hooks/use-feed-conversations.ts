import { useMemo } from "react";
import { usePaginatedConversations } from "#/hooks/query/use-paginated-conversations";

const FEED_PAGE_SIZE = 20;

/**
 * Conversations ordered by most recent activity. The underlying list polls,
 * so a conversation that gets a new message floats to the top of the feed.
 */
export const useFeedConversations = () => {
  const query = usePaginatedConversations(FEED_PAGE_SIZE);

  const conversations = useMemo(
    () =>
      (query.data?.pages ?? [])
        .flatMap((page) => page.items)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [query.data],
  );

  return {
    conversations,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
};
