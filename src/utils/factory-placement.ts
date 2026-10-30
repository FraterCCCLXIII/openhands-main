/**
 * Conversation tag that records the factory a conversation was started in, so
 * the placement survives another browser or cleared local storage. The key
 * follows the agent-server's lower-case, no-separator tag naming.
 */
export const FACTORY_TAG_KEY = "openhandsfactory";

/** Prefix of the temporary id a Cloud launch returns until its sandbox is ready. */
export const TASK_ID_PREFIX = "task-";

export const isTaskConversationId = (conversationId: string): boolean =>
  conversationId.startsWith(TASK_ID_PREFIX);

export const taskIdOf = (conversationId: string): string =>
  conversationId.slice(TASK_ID_PREFIX.length);

/** The tags that tie a new conversation to a factory. */
export const buildFactoryTags = (
  factoryId: string,
): Record<string, string> => ({
  [FACTORY_TAG_KEY]: factoryId,
});

export const getFactoryIdFromTags = (
  tags: Record<string, string> | null | undefined,
): string | null => tags?.[FACTORY_TAG_KEY]?.trim() || null;
