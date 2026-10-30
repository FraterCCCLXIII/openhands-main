import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Bot, Cpu, Inbox } from "lucide-react";
import { CustomChatInput } from "#/components/features/chat/custom-chat-input";
import { useNavigation } from "#/context/navigation-context";
import { useChatAttachmentUpload } from "#/hooks/chat/use-chat-attachment-upload";
import { useModelInterceptor } from "#/hooks/chat/use-model-interceptor";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { useIsCreatingConversation } from "#/hooks/use-is-creating-conversation";
import { useLlmConfigured } from "#/hooks/use-llm-configured";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { setPendingTaskAttachments } from "#/stores/pending-task-attachments-store";
import { useConversationComposer } from "#/hooks/use-conversation-composer";
import { enqueueHomeTaskPendingMessage } from "#/utils/enqueue-home-task-pending-message";
import { sendMessageWithAttachments } from "#/utils/send-message-with-attachments";
import { getApiErrorMessage } from "#/utils/api-error-message";
import {
  displayErrorToast,
  displaySuccessToastWithLink,
  displayWarningToast,
  TOAST_OPTIONS,
} from "#/utils/custom-toast-handlers";
import { I18nKey } from "#/i18n/declaration";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useLlmProfiles } from "#/hooks/query/use-llm-profiles";
import { useFeedFactories } from "#/hooks/use-feed-factories";
import { useFactoryConductor } from "#/hooks/use-factory-conductor";
import { useFeedFilterStore } from "#/stores/feed-filter-store";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFactoryInboxStore } from "#/stores/factory-inbox-store";
import { resolveTowerLaunch } from "#/utils/resolve-tower-launch";
import { FeedComposerMenu } from "./feed-composer-menu";

const FEED_ENTRY_POINT = "feed_composer";
const TASK_ID_PREFIX = "task-";
const NO_FACTORY = "none";
const CONDUCTOR = "conductor";
const MODEL_DEFAULT = "default";

/**
 * The app's chat composer, floated at the bottom of the feed. Submitting
 * starts a new conversation (text and attachments) that then appears in the
 * feed. The destination picks a factory inbox to place it in; that factory's
 * conductor (else the active agent profile) receives it, with the chosen
 * model. A launch that cannot finish in place — attachments for a cloud
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
  } = useConversationComposer();
  const { handleUpload } = useChatAttachmentUpload();

  const factories = useFeedFactories();
  const filterFactoryId = useFeedFilterStore((state) => state.filter.factoryId);
  const [chosenFactoryId, setChosenFactoryId] = useState<
    string | null | undefined
  >(undefined);
  const destinationId =
    chosenFactoryId === undefined ? filterFactoryId : chosenFactoryId;
  const factory = factories.find((f) => f.id === destinationId) ?? null;
  const [pickedProfileId, setPickedProfileId] = useState<string | null>(null);
  const [llmProfile, setLlmProfile] = useState<string | null>(null);

  const { data: agentProfiles } = useAgentProfiles();
  const { data: llmProfiles } = useLlmProfiles();
  const profiles = agentProfiles?.profiles ?? [];
  const models = llmProfiles?.profiles ?? [];
  const conductor = useFactoryConductor(factory?.id ?? null);
  const launch = resolveTowerLaunch({
    profiles,
    pickedProfileId,
    conductorProfileId: conductor?.profileId ?? null,
    hasFactory: Boolean(factory),
    activeProfileId: agentProfiles?.active_agent_profile_id ?? null,
  });
  const launchIsAcp = launch.profile?.agent_kind === "acp";
  const assignConversation = useFeedFactoriesStore(
    (state) => state.assignConversation,
  );
  const addInboxItem = useFactoryInboxStore((state) => state.addItem);

  const handleSubmit = (message: string) => {
    const text = message.trim();
    const hasAttachments = images.length > 0 || files.length > 0;
    if ((!text && !hasAttachments) || isPending || llmBlocked) return;

    const attachments = { images: [...images], files: [...files] };
    const toastId = toast.loading(
      t(I18nKey.HOME$CREATING_CONVERSATION),
      TOAST_OPTIONS,
    );

    const placedFactory = factory;
    const launchedAs = launch;
    void (async () => {
      try {
        // With attachments the first message is sent afterwards, so the
        // create must not also carry the text.
        const created = await createConversation({
          query: hasAttachments ? undefined : text || undefined,
          entryPoint: FEED_ENTRY_POINT,
          agentProfileId: launchedAs.profile?.id ?? undefined,
          llmProfile:
            llmProfile && launchedAs.profile?.agent_kind !== "acp"
              ? llmProfile
              : undefined,
        });
        toast.dismiss(toastId);
        const conversationId = created.conversation_id;
        const isTask = conversationId.startsWith(TASK_ID_PREFIX);

        if (placedFactory) {
          const agentName =
            launchedAs.profile?.name ?? conductor?.name ?? "OpenHands";
          // Place it before it reaches the lists, so it lands in this factory.
          assignConversation(conversationId, {
            factoryId: placedFactory.id,
            agentName,
          });
          addInboxItem({
            id: `${placedFactory.id}-${Date.now()}`,
            factoryId: placedFactory.id,
            text,
            targetLabel: t(I18nKey.FEED$COMPOSER_DESTINATION_INBOX, {
              name: placedFactory.name,
            }),
            kind: "new",
            agentName,
            conversationId,
            conversationTitle: null,
            reasons: [{ code: "picked" }],
            status: "sent",
            createdAt: new Date().toISOString(),
          });
          displaySuccessToastWithLink(
            t(I18nKey.FEED$COMPOSER_SENT_TO_INBOX, {
              factory: placedFactory.name,
            }),
            t(I18nKey.FEED$OPEN_SHORT),
            `/conversations/${conversationId}`,
          );
          if (
            launchedAs.source !== "conductor" &&
            launchedAs.source !== "picked"
          ) {
            displayWarningToast(
              t(I18nKey.FEED$COMPOSER_CONDUCTOR_FALLBACK, {
                factory: placedFactory.name,
                agent: agentName,
              }),
            );
          }
        }

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
        hideProfilePickers
        placeholder={t(I18nKey.FEED$COMPOSER_PLACEHOLDER)}
        toolbarLeading={
          <>
            <FeedComposerMenu
              testId="feed-composer-destination"
              label={t(I18nKey.FEED$COMPOSER_DESTINATION_LABEL)}
              icon={<Inbox size={14} aria-hidden />}
              value={
                factory
                  ? t(I18nKey.FEED$COMPOSER_DESTINATION_INBOX, {
                      name: factory.name,
                    })
                  : t(I18nKey.FEED$COMPOSER_DESTINATION_ALL)
              }
              selectedId={factory?.id ?? NO_FACTORY}
              onSelect={(id) =>
                setChosenFactoryId(id === NO_FACTORY ? null : id)
              }
              options={[
                {
                  id: NO_FACTORY,
                  label: t(I18nKey.FEED$COMPOSER_DESTINATION_ALL),
                },
                ...factories.map((f) => ({
                  id: f.id,
                  label: t(I18nKey.FEED$COMPOSER_DESTINATION_INBOX, {
                    name: f.name,
                  }),
                })),
              ]}
            />
            <FeedComposerMenu
              testId="feed-composer-agent"
              label={t(I18nKey.FEED$COMPOSER_AGENT_LABEL)}
              icon={<Bot size={14} aria-hidden />}
              value={
                pickedProfileId === null && factory
                  ? t(I18nKey.FEED$COMPOSER_CONDUCTOR)
                  : (launch.profile?.name ??
                    t(I18nKey.FEED$COMPOSER_AGENT_LABEL))
              }
              selectedId={pickedProfileId ?? (factory ? CONDUCTOR : null)}
              onSelect={(id) =>
                setPickedProfileId(id === CONDUCTOR ? null : id)
              }
              disabledReason={
                profiles.length === 0
                  ? t(I18nKey.FEED$COMPOSER_NO_AGENTS)
                  : undefined
              }
              options={[
                ...(factory
                  ? [
                      {
                        id: CONDUCTOR,
                        label: t(I18nKey.FEED$COMPOSER_CONDUCTOR_NAMED, {
                          name: conductor?.name ?? "OpenHands",
                        }),
                      },
                    ]
                  : []),
                ...profiles
                  .filter((p) => p.id)
                  .map((p) => ({ id: p.id as string, label: p.name })),
              ]}
            />
            <FeedComposerMenu
              testId="feed-composer-model"
              label={t(I18nKey.FEED$COMPOSER_MODEL_LABEL)}
              icon={<Cpu size={14} aria-hidden />}
              value={llmProfile ?? t(I18nKey.FEED$COMPOSER_MODEL_DEFAULT)}
              selectedId={llmProfile ?? MODEL_DEFAULT}
              onSelect={(id) => setLlmProfile(id === MODEL_DEFAULT ? null : id)}
              disabledReason={
                launchIsAcp
                  ? t(I18nKey.FEED$COMPOSER_MODEL_OWN)
                  : models.length === 0
                    ? t(I18nKey.FEED$COMPOSER_NO_MODELS)
                    : undefined
              }
              options={[
                {
                  id: MODEL_DEFAULT,
                  label: t(I18nKey.FEED$COMPOSER_MODEL_DEFAULT),
                },
                ...models.map((m) => ({
                  id: m.name,
                  label: m.name,
                  detail: m.model ?? undefined,
                })),
              ]}
            />
          </>
        }
      />
    </div>
  );
}
