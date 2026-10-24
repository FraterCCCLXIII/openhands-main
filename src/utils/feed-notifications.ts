import { ExecutionStatus } from "#/types/agent-server/core";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";

export type FeedNotificationKind =
  | "needs_input"
  | "error"
  | "finished"
  | "working"
  | "paused"
  | "idle";

/** What a conversation's execution state means to someone scanning notifications. */
export function getFeedNotificationKind(
  status: AppConversation["execution_status"],
): FeedNotificationKind {
  switch (status) {
    case ExecutionStatus.WAITING_FOR_CONFIRMATION:
      return "needs_input";
    case ExecutionStatus.ERROR:
    case ExecutionStatus.STUCK:
      return "error";
    case ExecutionStatus.FINISHED:
      return "finished";
    case ExecutionStatus.RUNNING:
      return "working";
    case ExecutionStatus.PAUSED:
      return "paused";
    default:
      return "idle";
  }
}

// Lower sorts first: what is waiting on a person comes before what is done.
const ATTENTION_ORDER: Record<FeedNotificationKind, number> = {
  needs_input: 0,
  error: 1,
  finished: 2,
  working: 3,
  paused: 4,
  idle: 5,
};

/** Needs-attention first, then most recently active within each kind. */
export function sortForNotifications(
  conversations: readonly AppConversation[],
): AppConversation[] {
  return [...conversations].sort(
    (a, b) =>
      ATTENTION_ORDER[getFeedNotificationKind(a.execution_status)] -
        ATTENTION_ORDER[getFeedNotificationKind(b.execution_status)] ||
      b.updated_at.localeCompare(a.updated_at),
  );
}
