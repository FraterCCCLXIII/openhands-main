import { useSearchParams } from "react-router";

/** The `/feed` search param that names the conversation open inside Tower. */
export const FEED_CONVERSATION_PARAM = "conversation";

/** `/feed?conversation=<id>`: the one owner of which conversation Tower shows. */
export function feedConversationPath(conversationId: string): string {
  return `/feed?${FEED_CONVERSATION_PARAM}=${encodeURIComponent(conversationId)}`;
}

/**
 * The conversation open in Tower's middle column, read from the URL so reload
 * and Back/Forward restore it. `close` drops the param (a push, so Back
 * reopens it) and keeps the rest of the query, such as the backend identity.
 */
export function useOpenFeedConversation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openConversationId = searchParams.get(FEED_CONVERSATION_PARAM);

  const close = () =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete(FEED_CONVERSATION_PARAM);
      return next;
    });

  return { openConversationId, close };
}
