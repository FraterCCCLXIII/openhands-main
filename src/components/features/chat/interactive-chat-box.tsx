import { useCallback, useRef } from "react";
import { AgentNotifications } from "./agent-notifications";
import { CustomChatInput } from "./custom-chat-input";
import { useAgentNotifications } from "#/hooks/chat/use-agent-notifications";
import { useBtwInterceptor } from "#/hooks/chat/use-btw-interceptor";
import { useGoalInterceptor } from "#/hooks/chat/use-goal-interceptor";
import { useModelInterceptor } from "#/hooks/chat/use-model-interceptor";
import { usePlanModeInterceptor } from "#/hooks/chat/use-plan-mode-interceptor";
import { useChatAttachmentUpload } from "#/hooks/chat/use-chat-attachment-upload";
import { AgentState } from "#/types/agent-state";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useOptionalConversationId } from "#/hooks/use-conversation-id";
import { GitControlBar } from "./git-control-bar";
import { useConversationStore } from "#/stores/conversation-store";
import { useConversationComposer } from "#/hooks/use-conversation-composer";
import { useAgentState } from "#/hooks/use-agent-state";
import { useSubConversationTaskPolling } from "#/hooks/query/use-sub-conversation-task-polling";
import { partitionImagesForUpload } from "#/components/features/chat/utils/chat-input.utils";
import { isTaskPolling } from "#/utils/utils";
import { setConversationState } from "#/utils/conversation-local-storage";

interface InteractiveChatBoxProps {
  onSubmit: (message: string, images: File[], files: File[]) => void;
  disabled?: boolean;
  hasStartedConversation?: boolean;
  showAgentNotifications?: boolean;
  showGitControlBar?: boolean;
  placeholder?: string;
  /** Whether the composer saves and restores a draft; see CustomChatInput. */
  persistDraft?: boolean;
}

export function InteractiveChatBox({
  onSubmit,
  disabled = false,
  hasStartedConversation,
  showAgentNotifications = false,
  showGitControlBar = true,
  placeholder,
  persistDraft = true,
}: InteractiveChatBoxProps) {
  const subConversationTaskId = useConversationStore(
    (state) => state.subConversationTaskId,
  );
  const { images, files, imagesMarkedUploadAsFile, clearAllFiles } =
    useConversationComposer();
  const { curAgentState } = useAgentState();
  const { data: conversation } = useActiveConversation();
  const { conversationId: routeConversationId } = useOptionalConversationId();
  const conversationId = routeConversationId ?? conversation?.id ?? null;

  const { taskStatus: subConversationTaskStatus } =
    useSubConversationTaskPolling(
      subConversationTaskId,
      conversation?.id || null,
    );

  const { handleUpload } = useChatAttachmentUpload();

  // Set when a submission reaches the agent rather than a slash-command handler.
  const sentToAgentRef = useRef(false);
  const handleAfterGoal = useBtwInterceptor(conversationId, (message) => {
    sentToAgentRef.current = true;
    const { imagesToEmbed, imagesAsFiles } = partitionImagesForUpload(
      images,
      imagesMarkedUploadAsFile,
    );
    onSubmit(message, imagesToEmbed, [...files, ...imagesAsFiles]);
    clearAllFiles();
  });
  const handleAfterPlanMode = usePlanModeInterceptor(
    conversationId,
    curAgentState,
    handleAfterGoal,
  );
  const handleAfterModel = useGoalInterceptor(
    conversationId,
    handleAfterPlanMode,
  );
  const handleInterceptedSubmit = useModelInterceptor(
    conversationId,
    handleAfterModel,
  );
  const handleSubmit = useCallback(
    (message: string) => {
      sentToAgentRef.current = false;
      handleInterceptedSubmit(message);
      // A sent message's saved draft is cleared when the agent echoes it back.
      // A command handled here (such as /model) is never echoed, so clear its
      // draft now, or the cleared composer would restore it on return.
      if (!sentToAgentRef.current && persistDraft && routeConversationId) {
        setConversationState(routeConversationId, { draftMessage: null });
      }
    },
    [handleInterceptedSubmit, persistDraft, routeConversationId],
  );

  const handleSuggestionsClick = (suggestion: string) => {
    handleSubmit(suggestion);
  };

  const agentNotifications = useAgentNotifications({
    conversationId,
    enabled: showAgentNotifications,
  });

  const isDisabled =
    disabled ||
    curAgentState === AgentState.AWAITING_USER_CONFIRMATION ||
    isTaskPolling(subConversationTaskStatus);

  return (
    <div
      data-testid="interactive-chat-box"
      className={
        showGitControlBar
          ? "pb-[calc(1rem*var(--oh-padding-scale,1))]"
          : undefined
      }
    >
      {agentNotifications.isVisible ? (
        <AgentNotifications
          agentNotifications={agentNotifications.agentNotifications}
          onCreateAll={agentNotifications.createAll}
          onDismiss={agentNotifications.dismiss}
          onRemove={agentNotifications.remove}
          disabled={isDisabled}
          isCreating={agentNotifications.isCreating}
        />
      ) : null}
      {showGitControlBar ? (
        <div className="mb-2" data-testid="chat-git-control-bar">
          <GitControlBar onSuggestionsClick={handleSuggestionsClick} />
        </div>
      ) : null}
      <CustomChatInput
        disabled={isDisabled}
        isNewConversationPending={disabled}
        hasStartedConversation={hasStartedConversation}
        placeholder={placeholder}
        persistDraft={persistDraft}
        onSubmit={handleSubmit}
        onFilesPaste={handleUpload}
      />
    </div>
  );
}
