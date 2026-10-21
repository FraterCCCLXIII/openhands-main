import { shouldRenderEvent } from "#/components/conversation-events/chat/event-content-helpers/should-render-event";
import { parseMessageFromEvent } from "#/components/conversation-events/chat/event-content-helpers/parse-message-from-event";
import type { OpenHandsEvent } from "#/types/agent-server/core";
import {
  isActionEvent,
  isAgentErrorEvent,
  isMessageEvent,
  isObservationEvent,
  isStreamingDeltaEvent,
  isUserMessageEvent,
} from "#/types/agent-server/type-guards";

export interface ConversationMinimapSegment {
  userEventId: string;
  /** Single-line preview of the user's message for the hover popover. */
  userPreview: string;
  /** Rough character weight of the agent reply until the next user turn. */
  agentResponseLength: number;
}

function measureAgentEventLength(event: OpenHandsEvent): number {
  if (isMessageEvent(event) && event.llm_message.role === "assistant") {
    return parseMessageFromEvent(event).length;
  }

  if (isActionEvent(event)) {
    const thoughtLength = event.thought?.length ?? 0;
    const actionLength = JSON.stringify(event.action ?? {}).length;
    return thoughtLength + Math.min(actionLength, 400);
  }

  if (isObservationEvent(event)) {
    return Math.min(JSON.stringify(event.observation ?? {}).length, 600);
  }

  if (isAgentErrorEvent(event)) {
    return event.error?.length ?? 40;
  }

  if (isStreamingDeltaEvent(event)) {
    return (
      (event.content?.length ?? 0) + (event.reasoning_content?.length ?? 0)
    );
  }

  return 24;
}

function normalizePreview(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Build one minimap segment per visible user turn. Each segment's bar width
 * reflects how much the agent produced before the next user message.
 */
export function buildConversationMinimapSegments(
  events: readonly OpenHandsEvent[],
): ConversationMinimapSegment[] {
  const segments: ConversationMinimapSegment[] = [];
  let current: ConversationMinimapSegment | null = null;

  for (const event of events) {
    if (isUserMessageEvent(event) && shouldRenderEvent(event)) {
      if (current) {
        segments.push(current);
      }
      current = {
        userEventId: event.id,
        userPreview: normalizePreview(parseMessageFromEvent(event)),
        agentResponseLength: 0,
      };
      continue;
    }

    if (
      current &&
      shouldRenderEvent(event) &&
      event.source !== "user" &&
      !isUserMessageEvent(event)
    ) {
      current.agentResponseLength += measureAgentEventLength(event);
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}
