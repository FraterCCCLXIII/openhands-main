import { useMemo } from "react";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import {
  FEED_FACTORIES,
  toFeedFactory,
  type FeedFactory,
} from "#/utils/feed-team-demo";

/** The built-in factories followed by the ones people added. */
export function useFeedFactories(): FeedFactory[] {
  const custom = useFeedFactoriesStore((state) => state.custom);
  return useMemo(
    () => [...FEED_FACTORIES, ...custom.map(toFeedFactory)],
    [custom],
  );
}
