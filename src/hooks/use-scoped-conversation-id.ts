import { useOptionalConversationId } from "#/hooks/use-conversation-id";

/**
 * Resolve which conversation a component is acting on. An explicit id wins;
 * otherwise the id comes from the surrounding navigation scope (the routed
 * conversation), and is null on surfaces without one such as Home.
 */
export function useScopedConversationId(
  conversationId?: string | null,
): string | null {
  const { conversationId: contextConversationId } = useOptionalConversationId();
  return conversationId ?? contextConversationId;
}
