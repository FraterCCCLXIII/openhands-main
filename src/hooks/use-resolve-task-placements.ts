import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AgentServerConversationService from "#/api/conversation-service/agent-server-conversation-service.api";
import { useFactoryInboxStore } from "#/stores/factory-inbox-store";
import { useFeedPendingStore } from "#/stores/feed-pending-store";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { isTaskConversationId, taskIdOf } from "#/utils/factory-placement";

const POLL_MS = 3000;
// Shared by every caller so one pending launch is looked up once at a time.
const inFlight = new Set<string>();
const abandoned = new Set<string>();

/**
 * A Cloud launch is placed in its factory under the temporary `task-` id it
 * returns. Once the start task is ready, moves the placement to the real
 * conversation id, which is the id the lists use.
 */
export function useResolveTaskPlacements(): void {
  const queryClient = useQueryClient();
  const assignments = useFeedFactoriesStore((state) => state.assignments);
  // Optimistic feed cards wait on the same temporary ids, including sends that
  // were not placed in a factory.
  const pendingCards = useFeedPendingStore((state) =>
    state.items
      .map((item) => item.conversationId)
      .filter((id): id is string => !!id && isTaskConversationId(id))
      .join(","),
  );
  const inboxTasks = useFactoryInboxStore((state) =>
    state.items
      .map((item) => item.conversationId)
      .filter((id): id is string => !!id && isTaskConversationId(id))
      .join(","),
  );
  const pending = [
    ...new Set(
      Object.keys(assignments)
        .filter(isTaskConversationId)
        .concat(pendingCards ? pendingCards.split(",") : [])
        .concat(inboxTasks ? inboxTasks.split(",") : []),
    ),
  ].join(",");

  useEffect(() => {
    if (!pending) return undefined;
    const resolve = () => {
      pending.split(",").forEach((placedId) => {
        if (inFlight.has(placedId) || abandoned.has(placedId)) return;
        inFlight.add(placedId);
        AgentServerConversationService.getStartTask(taskIdOf(placedId))
          .then((task) => {
            if (!task) {
              abandoned.add(placedId);
              return;
            }
            if (task.status === "ERROR") {
              abandoned.add(placedId);
              useFeedPendingStore
                .getState()
                .items.filter((item) => item.conversationId === placedId)
                .forEach((item) =>
                  useFeedPendingStore.getState().fail(item.id),
                );
              return;
            }
            if (task.app_conversation_id) {
              useFeedFactoriesStore
                .getState()
                .replaceConversationId(placedId, task.app_conversation_id);
              useFactoryInboxStore
                .getState()
                .replaceConversationId(placedId, task.app_conversation_id);
              useFeedPendingStore
                .getState()
                .replaceConversationId(placedId, task.app_conversation_id);
              void queryClient.invalidateQueries({
                queryKey: ["user", "conversations"],
              });
            }
          })
          .catch(() => undefined)
          .finally(() => inFlight.delete(placedId));
      });
    };
    resolve();
    const timer = setInterval(resolve, POLL_MS);
    return () => clearInterval(timer);
  }, [pending, queryClient]);
}
