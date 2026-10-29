import {
  useFeedRepliesStore,
  type FeedReply,
} from "#/stores/feed-replies-store";
import { identityDirectory, LOCAL_ME } from "./identity-directory";
import type {
  ChannelId,
  ChatMessage,
  ChatTransport,
  Identity,
  Member,
  OutgoingMessage,
} from "./types";

const toMessage = (reply: FeedReply): ChatMessage => {
  const author: Identity = identityDirectory.get(reply.personId) ?? {
    id: reply.personId,
    displayName: reply.author,
    kind: reply.kind === "teammate" ? "person" : "agent",
  };
  return {
    id: reply.id,
    channel: reply.conversationId,
    // A reply to the thread's root points at the channel itself.
    parent: reply.parentId === reply.conversationId ? null : reply.parentId,
    author,
    text: reply.text,
    mentions: identityDirectory
      .resolveMentions(reply.text)
      .map((identity) => ({ identityId: identity.id })),
    timestamp: reply.timestamp,
  };
};

/**
 * Local-only transport: replies live in the browser-local replies store, so
 * nothing leaves the device and people who do not opt in see no change.
 */
export function createLocalChatTransport(
  me: Identity = LOCAL_ME,
): ChatTransport {
  return {
    subscribe(channel, onMessage) {
      const seen = new Set<string>();
      const deliver = (replies: FeedReply[]) =>
        replies
          .filter((r) => r.conversationId === channel && !seen.has(r.id))
          .forEach((reply) => {
            seen.add(reply.id);
            onMessage(toMessage(reply));
          });
      deliver(useFeedRepliesStore.getState().replies);
      return useFeedRepliesStore.subscribe((state) => deliver(state.replies));
    },

    async post(channel: ChannelId, message: OutgoingMessage) {
      useFeedRepliesStore.getState().addReply({
        id: `${channel}-reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conversationId: channel,
        parentId: message.parent ?? channel,
        personId: me.id,
        author: me.displayName,
        kind: me.kind === "agent" ? "agent" : "teammate",
        text: message.text,
        timestamp: new Date().toISOString(),
      });
    },

    async members(): Promise<Member[]> {
      return identityDirectory.all();
    },

    identity: () => me,
  };
}
