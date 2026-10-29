import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";

/** How the feed is ordered; "agent" keeps the activity order and stacks by agent. */
export type FeedSort = "agent" | "latest" | "oldest" | "title";

export const DEFAULT_FEED_SORT: FeedSort = "agent";

export const FEED_SORTS: readonly FeedSort[] = [
  "latest",
  "oldest",
  "title",
  "agent",
];

const byUpdatedAt = (a: AppConversation, b: AppConversation): number =>
  a.updated_at.localeCompare(b.updated_at);

/** Returns a re-ordered copy; "latest" and "agent" are newest activity first. */
export function sortFeedConversations(
  conversations: AppConversation[],
  sort: FeedSort,
): AppConversation[] {
  const copy = [...conversations];
  if (sort === "oldest") return copy.sort(byUpdatedAt);
  if (sort === "title") {
    return copy.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
  }
  return copy.sort((a, b) => byUpdatedAt(b, a));
}
