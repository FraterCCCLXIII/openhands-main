import { useSearchParams } from "react-router";

export type FeedView = "feed" | "notifications" | "inbox";

/** The `/feed` search param that names the tab shown in Tower's middle column. */
export const FEED_VIEW_PARAM = "view";
/** With `view=inbox`: the factory whose inbox is shown; none is every factory. */
export const FEED_INBOX_FACTORY_PARAM = "factory";

const VIEWS: readonly FeedView[] = ["feed", "notifications", "inbox"];

/** `/feed?view=inbox`, scoped with `&factory=<id>` to one factory's inbox. */
export function feedInboxPath(factoryId: string | null = null): string {
  const params = new URLSearchParams({ [FEED_VIEW_PARAM]: "inbox" });
  if (factoryId) params.set(FEED_INBOX_FACTORY_PARAM, factoryId);
  return `/feed?${params.toString()}`;
}

/**
 * The tab open in Tower, read from the URL so reload and Back/Forward restore
 * it. Leaving the inbox drops its factory scope; the rest of the query, such
 * as the backend identity, is kept.
 */
export function useFeedView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(FEED_VIEW_PARAM);
  const view = VIEWS.find((candidate) => candidate === raw) ?? "feed";
  const inboxFactoryParam = searchParams.get(FEED_INBOX_FACTORY_PARAM);

  const setView = (next: FeedView, factoryId: string | null = null) =>
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      params.delete(FEED_INBOX_FACTORY_PARAM);
      if (next === "feed") params.delete(FEED_VIEW_PARAM);
      else params.set(FEED_VIEW_PARAM, next);
      if (next === "inbox" && factoryId) {
        params.set(FEED_INBOX_FACTORY_PARAM, factoryId);
      }
      return params;
    });

  /** Re-scopes the open inbox without adding history entries. */
  const setInboxFactoryParam = (factoryId: string | null) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (factoryId) params.set(FEED_INBOX_FACTORY_PARAM, factoryId);
        else params.delete(FEED_INBOX_FACTORY_PARAM);
        return params;
      },
      { replace: true },
    );

  return { view, inboxFactoryParam, setView, setInboxFactoryParam };
}
