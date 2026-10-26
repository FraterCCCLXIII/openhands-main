import { useActiveBackend } from "#/contexts/active-backend-context";
import { useArchivedConversationsStore } from "#/stores/archived-conversations-store";
import { usePinnedConversationsStore } from "#/stores/pinned-conversations-store";

const EMPTY_IDS: readonly string[] = [];

/** Whether a conversation is pinned or archived on the active backend, and the actions that change it. */
export const useFeedConversationFlags = (conversationId: string) => {
  const { backend } = useActiveBackend();
  const isPinned = usePinnedConversationsStore((state) =>
    (state.pinsByBackendId[backend.id] ?? EMPTY_IDS).includes(conversationId),
  );
  const isArchived = useArchivedConversationsStore((state) =>
    (state.archivesByBackendId[backend.id] ?? EMPTY_IDS).includes(
      conversationId,
    ),
  );
  const togglePin = usePinnedConversationsStore((state) => state.togglePin);
  const unpin = usePinnedConversationsStore((state) => state.unpinConversation);
  const archive = useArchivedConversationsStore(
    (state) => state.archiveConversation,
  );
  const unarchive = useArchivedConversationsStore(
    (state) => state.removeArchivedConversation,
  );

  return {
    isPinned,
    isArchived,
    togglePin: () => togglePin(backend.id, conversationId),
    unpin: () => unpin(backend.id, conversationId),
    archive: () => archive(backend.id, conversationId),
    unarchive: () => unarchive(backend.id, conversationId),
  };
};
