import { useMemo } from "react";
import { useEventStore } from "#/stores/use-event-store";
import { summarizeConversationActivity } from "#/utils/conversation-activity-summary";

/** Activity tallies for the open conversation, recomputed as events arrive. */
export function useConversationActivitySummary() {
  const events = useEventStore((state) => state.events);

  return useMemo(() => summarizeConversationActivity(events), [events]);
}
