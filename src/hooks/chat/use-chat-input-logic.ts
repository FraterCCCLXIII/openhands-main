import { useRef, useCallback, useEffect } from "react";
import {
  isContentEmpty,
  getTextContent,
} from "#/components/features/chat/utils/chat-input.utils";
import { useConversationStore } from "#/stores/conversation-store";
import { useConversationComposer } from "#/hooks/use-conversation-composer";
import { useOptionalConversationId } from "#/hooks/use-conversation-id";
import { useDraftPersistence } from "./use-draft-persistence";

/**
 * Hook for managing chat input content logic.
 *
 * `persistDraft: false` turns off draft persistence for a composer that does
 * not own a draft (see `useDraftPersistence`).
 */
export const useChatInputLogic = ({
  persistDraft = true,
}: { persistDraft?: boolean } = {}) => {
  const chatInputRef = useRef<HTMLDivElement | null>(null);
  // Optional because the chat input also renders on the home page, where no
  // conversation route is mounted yet. Draft persistence is conversation-
  // scoped, so it no-ops when this is undefined.
  const { conversationId } = useOptionalConversationId();

  // Composer state is scoped to this composer's conversation (or Home), so
  // a message queued for another conversation can never land here.
  const {
    messageToSend,
    messageRestoreIfEmpty,
    setMessageToSend,
    clearMessageRestoreIfEmpty,
  } = useConversationComposer();
  const hasRightPanelToggled = useConversationStore(
    (state) => state.hasRightPanelToggled,
  );
  const setIsRightPanelShown = useConversationStore(
    (state) => state.setIsRightPanelShown,
  );

  // Draft persistence - saves to localStorage/sessionStorage, restores on mount
  const { saveDraft, clearDraft } = useDraftPersistence(
    conversationId,
    chatInputRef,
    { persist: persistDraft },
  );

  // Restore a cancelled pending send (or, on the home page, a prompt whose
  // launch failed) back into the input only when empty.
  useEffect(() => {
    if (!messageRestoreIfEmpty) {
      return;
    }

    const element = chatInputRef.current;
    const currentText = getTextContent(element).trim();
    if (currentText.length === 0) {
      if (conversationId) {
        setMessageToSend(messageRestoreIfEmpty.text);
      } else if (element) {
        // Write the text directly rather than queueing it as messageToSend:
        // the input event runs the same path as typing (resize, draft save
        // and submit-button state).
        element.textContent = messageRestoreIfEmpty.text;
        element.dispatchEvent(new InputEvent("input", { bubbles: true }));
      }
    }
    clearMessageRestoreIfEmpty();
  }, [
    conversationId,
    messageRestoreIfEmpty,
    setMessageToSend,
    clearMessageRestoreIfEmpty,
  ]);

  // Save current input value when drawer state changes (conversation view only)
  useEffect(() => {
    if (!conversationId) return;
    if (chatInputRef.current) {
      const currentText = getTextContent(chatInputRef.current);
      setMessageToSend(currentText);
      setIsRightPanelShown(hasRightPanelToggled);
    }
  }, [
    conversationId,
    hasRightPanelToggled,
    setMessageToSend,
    setIsRightPanelShown,
  ]);

  // Helper function to check if contentEditable is truly empty
  const checkIsContentEmpty = useCallback(
    (): boolean => isContentEmpty(chatInputRef.current),
    [],
  );

  // Get current message text
  const getCurrentMessage = useCallback(
    (): string => getTextContent(chatInputRef.current),
    [],
  );

  return {
    chatInputRef,
    messageToSend,
    checkIsContentEmpty,
    getCurrentMessage,
    saveDraft,
    clearDraft,
  };
};
