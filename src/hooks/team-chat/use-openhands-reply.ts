import { useCallback } from "react";
import AgentServerConversationService from "#/api/conversation-service/agent-server-conversation-service.api";
import EventService from "#/api/event-service/event-service.api";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { toFeedUpdates } from "#/utils/feed-updates";

const ENTRY_POINT = "team_chat";
const POLL_MS = 3000;
const TIMEOUT_MS = 3 * 60 * 1000;
const DONE_STATUSES = new Set(["finished", "idle"]);
const FAILED_STATUSES = new Set(["error", "stuck"]);

export interface OpenHandsReply {
  conversationId: string;
  text: string;
}

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Starts a real conversation with the request text, waits for the run to finish (up to
 * three minutes) and returns the agent's last message. Throws with a short reason on a
 * failed or timed-out run.
 */
export function useOpenHandsReply() {
  const { mutateAsync: createConversation } = useCreateConversation({
    disableToast: true,
  });

  return useCallback(
    async (request: string): Promise<OpenHandsReply> => {
      const created = await createConversation({
        query: request,
        entryPoint: ENTRY_POINT,
      });
      const conversationId = created.conversation_id;
      const deadline = Date.now() + TIMEOUT_MS;
      while (Date.now() < deadline) {
        await wait(POLL_MS);

        const [conversation] =
          await AgentServerConversationService.batchGetAppConversations([
            conversationId,
          ]);
        const status = conversation?.execution_status ?? null;
        if (conversation && status && FAILED_STATUSES.has(status)) {
          throw new Error(`the run ended with status "${status}"`);
        }
        if (conversation && status && DONE_STATUSES.has(status)) {
          const page = await EventService.searchEvents(
            conversationId,
            conversation.conversation_url,
            conversation.session_api_key,
            { limit: 100, sortOrder: "TIMESTAMP" },
          );
          const answer = toFeedUpdates(page.items, { fullText: true }).find(
            (u) => u.kind === "agent" && u.text.trim(),
          );
          if (answer) return { conversationId, text: answer.text.trim() };
        }
      }
      throw new Error("it took longer than 3 minutes");
    },
    [createConversation],
  );
}
