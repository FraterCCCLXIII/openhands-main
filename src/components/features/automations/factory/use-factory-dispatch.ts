import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { FEED_QUERY_KEYS } from "#/hooks/query/query-keys";
import { useKnownFeedAgents } from "#/hooks/use-known-feed-agents";
import { useFactoryInboxStore } from "#/stores/factory-inbox-store";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { displayErrorToast } from "#/utils/custom-toast-handlers";
import { getApiErrorMessage } from "#/utils/api-error-message";
import type { RouteDecision } from "#/utils/factory-routing";
import { sendMessageWithAttachments } from "#/utils/send-message-with-attachments";

const ENTRY_POINT = "factory_inbox";

interface DispatchInput {
  factoryId: string;
  factoryName: string;
  text: string;
  targetLabel: string;
  decision: RouteDecision;
  /** The title of the conversation it goes to, for the log. */
  conversationTitle: string | null;
}

/**
 * Carries out a routing decision: sends the request to the conversation the
 * router chose, or starts a new one, and logs it in the factory inbox. A new
 * conversation is placed in the factory with the chosen agent.
 */
export function useFactoryDispatch() {
  const { t } = useTranslation("openhands");
  const queryClient = useQueryClient();
  const { mutateAsync: createConversation } = useCreateConversation({
    disableToast: true,
  });
  const knownAgents = useKnownFeedAgents();
  const addItem = useFactoryInboxStore((state) => state.addItem);
  const assignConversation = useFeedFactoriesStore(
    (state) => state.assignConversation,
  );

  return useCallback(
    async (input: DispatchInput): Promise<void> => {
      const { decision, factoryId, factoryName, text } = input;
      const log = (status: "sent" | "failed", conversationId: string | null) =>
        addItem({
          id: `${factoryId}-${Date.now()}`,
          factoryId,
          text,
          targetLabel: input.targetLabel,
          kind: decision.kind,
          agentName: decision.agentName,
          conversationId,
          conversationTitle: input.conversationTitle,
          reasons: decision.reasons,
          status,
          createdAt: new Date().toISOString(),
        });

      try {
        let conversationId = decision.conversationId;
        if (decision.kind === "existing" && conversationId) {
          await sendMessageWithAttachments({
            conversationId,
            content: text,
            images: [],
            files: [],
            imagesMarkedUploadAsFile: [],
            t,
          });
        } else {
          const created = await createConversation({
            query: `${text}\n\nSent to the ${factoryName} factory inbox and assigned to ${decision.agentName}.`,
            entryPoint: ENTRY_POINT,
            // A real agent profile launches as itself; a simulated persona has
            // none, so the active profile runs it.
            agentProfileId: knownAgents.find(
              (agent) => agent.name === decision.agentName,
            )?.profileId,
          });
          conversationId = created.conversation_id;
          // Place it before it reaches the lists, so it lands in this factory.
          assignConversation(conversationId, {
            factoryId,
            agentName: decision.agentName,
          });
        }
        log("sent", conversationId);
        void queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEYS.all });
        void queryClient.invalidateQueries({
          queryKey: ["user", "conversations"],
        });
      } catch (error) {
        const fallback = error instanceof Error ? error.message : "";
        displayErrorToast(getApiErrorMessage(error, fallback) || null);
        log("failed", null);
      }
    },
    [
      addItem,
      assignConversation,
      createConversation,
      knownAgents,
      queryClient,
      t,
    ],
  );
}
