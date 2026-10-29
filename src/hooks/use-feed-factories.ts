import { useMemo } from "react";
import { Factory } from "lucide-react";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { pickFeedTint } from "#/utils/feed-demo-agents";
import { FEED_FACTORIES, type FeedFactory } from "#/utils/feed-team-demo";

/** The built-in factories followed by the ones people added. */
export function useFeedFactories(): FeedFactory[] {
  const custom = useFeedFactoriesStore((state) => state.custom);
  return useMemo(
    () => [
      ...FEED_FACTORIES,
      ...custom.map((factory) => ({
        ...factory,
        Icon: Factory,
        className: pickFeedTint(factory.id),
      })),
    ],
    [custom],
  );
}
