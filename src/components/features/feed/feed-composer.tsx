import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { CustomChatInput } from "#/components/features/chat/custom-chat-input";
import { useNavigation } from "#/context/navigation-context";
import { useChatAttachmentUpload } from "#/hooks/chat/use-chat-attachment-upload";
import { useModelInterceptor } from "#/hooks/chat/use-model-interceptor";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { useIsCreatingConversation } from "#/hooks/use-is-creating-conversation";
import { useLlmConfigured } from "#/hooks/use-llm-configured";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { setPendingTaskAttachments } from "#/stores/pending-task-attachments-store";
import { useConversationStore } from "#/stores/conversation-store";
import { enqueueHomeTaskPendingMessage } from "#/utils/enqueue-home-task-pending-message";
import { sendMessageWithAttachments } from "#/utils/send-message-with-attachments";
import { getApiErrorMessage } from "#/utils/api-error-message";
import {
  displayErrorToast,
  TOAST_OPTIONS,
} from "#/utils/custom-toast-handlers";
import { I18nKey } from "#/i18n/declaration";

const FEED_ENTRY_POINT = "feed_composer";
const TASK_ID_PREFIX = "task-";

/**
 * The app's chat composer, floated at the bottom of the feed. Submitting
 * starts a new conversation (text and attachments) that then appears in the
 * feed. A launch that cannot finish in place — attachments for a cloud
 * sandbox that is still provisioning — opens the new conversation so its
 * page can complete the send.
 */
export function FeedComposer() {
  const { t } = useTranslation("openhands");
  const { backend } = useActiveBackend();
  const { navigate } = useNavigation();
  const isLocal = backend.kind === "local";
  const { mutateAsync: createConversation, isPending } = useCreateConversation({
    disableToast: true,
  });
  const isCreatingElsewhere = useIsCreatingConversation();
  const { isConfigured, isLoading: isLlmLoading } = useLlmConfigured();
  const llmBlocked = !isLlmLoading && !isConfigured;
  const {
    images,
    files,
    imagesMarkedUploadAsFile,
    clearAllFiles,
    restoreMessageToInputIfEmpty,
  } = useConversationStore();
  const { handleUpload } = useChatAttachmentUpload();

  const handleSubmit = (message: string) => {
    const text = message.trim();
    const hasAttachments = images.length > 0 || files.length > 0;
    if ((!text && !hasAttachments) || isPending || llmBlocked) return;

    const attachments = { images: [...images], files: [...files] };
    const toastId = toast.loading(
      t(I18nKey.HOME$CREATING_CONVERSATION),
      TOAST_OPTIONS,
    );

    void (async () => {
      try {
        // With attachments the first message is sent afterwards, so the
        // create must not also carry the text.
        const created = await createConversation({
          query: hasAttachments ? undefined : text || undefined,
          entryPoint: FEED_ENTRY_POINT,
        });
        toast.dismiss(toastId);
        const conversationId = created.conversation_id;
        const isTask = conversationId.startsWith(TASK_ID_PREFIX);

        if (hasAttachments && (!isLocal || isTask)) {
          const taskId =
            created.task_id ??
            (isTask ? conversationId.slice(TASK_ID_PREFIX.length) : null);
          if (!taskId) {
            displayErrorToast(null);
            return;
          }
          setPendingTaskAttachments(taskId, {
            content: text,
            images: attachments.images,
            files: attachments.files,
            imagesMarkedUploadAsFile: [...imagesMarkedUploadAsFile],
          });
          clearAllFiles();
          await enqueueHomeTaskPendingMessage({
            conversationId,
            text,
            images: attachments.images,
            imagesMarkedUploadAsFile,
          });
          navigate(`/conversations/${conversationId}`);
          return;
        }

        if (hasAttachments) {
          await sendMessageWithAttachments({
            conversationId,
            content: text,
            images: attachments.images,
            files: attachments.files,
            imagesMarkedUploadAsFile,
            t,
          });
          clearAllFiles();
        } else if (isTask && text) {
          await enqueueHomeTaskPendingMessage({
            conversationId,
            text,
            images: [],
            imagesMarkedUploadAsFile: [],
          });
        }
      } catch (error) {
        toast.dismiss(toastId);
        const fallback = error instanceof Error ? error.message : "";
        displayErrorToast(getApiErrorMessage(error, fallback) || null);
        restoreMessageToInputIfEmpty(message);
      }
    })();
  };

  // Keeps a typed `/model NAME` from becoming the new conversation's prompt.
  const handleSubmitWithModelGuard = useModelInterceptor(null, handleSubmit);

  return (
    <div data-testid="feed-composer" className="w-full">
      <CustomChatInput
        onSubmit={handleSubmitWithModelGuard}
        onFilesPaste={handleUpload}
        disabled={isPending || isCreatingElsewhere || llmBlocked}
        persistDraft={false}
        placeholder={t(I18nKey.FEED$COMPOSER_PLACEHOLDER)}
      />
    </div>
  );
}
