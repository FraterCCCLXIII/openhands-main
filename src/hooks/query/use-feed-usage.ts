import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { toFeedUsage } from "#/utils/feed-usage";
import { useConversationMetrics } from "./use-conversation-metrics";

/**
 * Token and context-window usage for a feed card. Reads the runtime snapshot
 * once the card is in view and falls back to the figures the conversation
 * list already carries.
 */
export const useFeedUsage = (
  conversation: AppConversation,
  enabled: boolean,
) => {
  const runtimeUp =
    !conversation.sandbox_status || conversation.sandbox_status === "RUNNING";
  const { data } = useConversationMetrics(
    conversation.id,
    conversation.conversation_url,
    conversation.session_api_key,
    enabled && runtimeUp,
  );
  return toFeedUsage(data ?? conversation.metrics);
};
