import { useQuery } from "@tanstack/react-query";
import AgentServerConversationService from "#/api/conversation-service/agent-server-conversation-service.api";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import type { FeedSubagentNode } from "#/utils/feed-subagents";
import { FEED_QUERY_KEYS } from "./query-keys";

// A subagent can manage subagents of its own; stop walking after a few levels
// or a runaway delegation chain would turn one card into a request storm.
const MAX_SUBAGENT_DEPTH = 4;
const MAX_SUBAGENTS = 40;

/**
 * Every subagent a conversation manages, its subagents' subagents included,
 * found level by level through each conversation's `sub_conversation_ids`.
 */
export const useFeedSubagents = (
  conversation: AppConversation,
  enabled: boolean,
) => {
  const childIds = conversation.sub_conversation_ids ?? [];

  return useQuery({
    queryKey: FEED_QUERY_KEYS.subagents(
      conversation.id,
      conversation.updated_at,
      childIds,
    ),
    enabled: enabled && childIds.length > 0,
    queryFn: async () => {
      const nodes: FeedSubagentNode[] = [];
      let level = childIds.map((id) => ({ id, parentId: conversation.id }));
      for (
        let depth = 1;
        depth <= MAX_SUBAGENT_DEPTH &&
        level.length > 0 &&
        nodes.length < MAX_SUBAGENTS;
        depth += 1
      ) {
        // Sequential on purpose: each level's ids come from the previous one.

        const fetched =
          await AgentServerConversationService.batchGetAppConversations(
            level.map(({ id }) => id),
          );
        const next: typeof level = [];
        fetched.forEach((child, index) => {
          if (!child) return;
          nodes.push({
            conversation: child,
            parentId: level[index].parentId,
            depth,
          });
          (child.sub_conversation_ids ?? []).forEach((id) =>
            next.push({ id, parentId: child.id }),
          );
        });
        level = next;
      }
      return nodes.slice(0, MAX_SUBAGENTS);
    },
    staleTime: 30_000,
    retry: false,
    meta: { disableToast: true },
  });
};
