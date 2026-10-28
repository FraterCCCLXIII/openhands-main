import { create } from "zustand";
import { ALL_FEED_FILTER, type FeedFilter } from "#/utils/feed-filters";

interface FeedFilterState {
  filter: FeedFilter;
  setFilter: (filter: FeedFilter) => void;
}

/**
 * The feed's active filters. The feed and the profile pages share the same
 * side columns, so a filter picked on a profile carries back to the feed.
 */
export const useFeedFilterStore = create<FeedFilterState>()((set) => ({
  filter: ALL_FEED_FILTER,
  setFilter: (filter) => set({ filter }),
}));
