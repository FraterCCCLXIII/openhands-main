import { useMemo } from "react";
import { useConversationEvents } from "#/hooks/use-conversation-events";
import { summarizeConversationActivity } from "#/utils/conversation-activity-summary";

/** Activity tallies for the open conversation, recomputed as events arrive. */
export function useConversationActivitySummary() {
  const events = useConversationEvents();

  return useMemo(() => summarizeConversationActivity(events), [events]);
}
