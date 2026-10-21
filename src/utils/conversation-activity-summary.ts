import type { OHEvent } from "#/stores/use-event-store";
import {
  isActionEvent,
  isBrowserNavigateActionEvent,
  isCondensationEvent,
  isExecuteBashActionEvent,
  isLaunchChildConversationActionEvent,
  isUserMessageEvent,
} from "#/types/agent-server/type-guards";

/** Tool actions that create or change a file on disk. */
const FILE_EDITOR_ACTION_KINDS: ReadonlySet<string> = new Set([
  "FileEditorAction",
  "PlanningFileEditorAction",
]);

export interface ConversationActivitySummary {
  /** Messages the user has sent in this conversation. */
  userMessages: number;
  /** Times the agent compacted its history to stay inside the context window. */
  compactions: number;
  /** ISO timestamp of the newest event, or null when there are no events. */
  lastActiveAt: string | null;
  /** Shell commands the agent ran. */
  commands: number;
  /** Distinct file paths the agent created or edited. */
  filesTouched: number;
  /** Pages the agent navigated to in a browser. */
  pagesBrowsed: number;
  /** Child conversations the agent launched. */
  subthreads: number;
}

/**
 * Tallies what happened in a conversation from its event log, for the
 * overview panel. Pure so the counting rules can be tested without the store.
 */
export function summarizeConversationActivity(
  events: readonly OHEvent[],
): ConversationActivitySummary {
  const summary: ConversationActivitySummary = {
    userMessages: 0,
    compactions: 0,
    lastActiveAt: null,
    commands: 0,
    filesTouched: 0,
    pagesBrowsed: 0,
    subthreads: 0,
  };
  const touchedPaths = new Set<string>();

  for (const event of events) {
    if ("timestamp" in event && typeof event.timestamp === "string") {
      if (!summary.lastActiveAt || event.timestamp > summary.lastActiveAt) {
        summary.lastActiveAt = event.timestamp;
      }
    }

    if (isUserMessageEvent(event)) {
      summary.userMessages += 1;
    } else if (isCondensationEvent(event)) {
      summary.compactions += 1;
    } else if (isExecuteBashActionEvent(event)) {
      summary.commands += 1;
    } else if (isBrowserNavigateActionEvent(event)) {
      summary.pagesBrowsed += 1;
    } else if (isLaunchChildConversationActionEvent(event)) {
      summary.subthreads += 1;
    } else if (
      isActionEvent(event) &&
      FILE_EDITOR_ACTION_KINDS.has(event.action.kind) &&
      "path" in event.action &&
      typeof event.action.path === "string"
    ) {
      touchedPaths.add(event.action.path);
    }
  }

  summary.filesTouched = touchedPaths.size;
  return summary;
}
