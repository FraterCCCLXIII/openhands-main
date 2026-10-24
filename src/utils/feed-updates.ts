import type { OpenHandsEvent } from "#/types/agent-server/core";
import {
  isActionEvent,
  isConversationErrorEvent,
  isMessageEvent,
} from "#/types/agent-server/type-guards";

export type FeedUpdateKind = "user" | "agent" | "action" | "error";

export interface FeedUpdate {
  id: string;
  kind: FeedUpdateKind;
  timestamp: string;
  /** Message text, or the tool name for an `action`. */
  text: string;
}

export const FEED_UPDATE_LIMIT = 6;

const MAX_UPDATE_TEXT = 280;

const truncate = (text: string): string =>
  text.length > MAX_UPDATE_TEXT
    ? `${text.slice(0, MAX_UPDATE_TEXT).trimEnd()}…`
    : text;

function toFeedUpdate(event: OpenHandsEvent): FeedUpdate | null {
  if (isMessageEvent(event)) {
    const text = event.llm_message.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join(" ")
      .trim();
    if (!text) return null;
    return {
      id: event.id,
      kind: event.llm_message.role === "user" ? "user" : "agent",
      timestamp: event.timestamp,
      text: truncate(text),
    };
  }
  if (isActionEvent(event)) {
    return {
      id: event.id,
      kind: "action",
      timestamp: event.timestamp,
      text: event.tool_name,
    };
  }
  if (isConversationErrorEvent(event)) {
    if (!event.id || !event.timestamp) return null;
    return {
      id: event.id,
      kind: "error",
      timestamp: event.timestamp,
      text: truncate(event.detail ?? event.code ?? ""),
    };
  }
  return null;
}

/**
 * Reduces raw conversation events to the few that read well in a feed card:
 * user and agent messages, tool calls, and conversation errors. Returns them
 * newest first.
 */
export function toFeedUpdates(events: OpenHandsEvent[]): FeedUpdate[] {
  return events
    .map(toFeedUpdate)
    .filter((update): update is FeedUpdate => update !== null)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
